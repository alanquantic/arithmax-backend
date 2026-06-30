/* eslint-disable no-await-in-loop, no-restricted-syntax, no-console, @typescript-eslint/no-explicit-any */
/**
 * Migración de datos WordPress -> Neon.
 *
 * Fuente (una de las dos):
 *   - WP_USERS_FILE: ruta a un JSON con la respuesta del endpoint admin
 *     (objeto { users: [...] } o directamente el array de usuarios).
 *   - WP_ADMIN_URL + WP_ADMIN_USER + WP_ADMIN_APP_PASSWORD: llama
 *     GET {WP_ADMIN_URL} con Basic Auth (Application Password de un admin).
 *
 * Flags:
 *   --dry-run (o DRY_RUN=true): no escribe en Neon, solo transforma y reporta
 *   (incluye la deteccion de fechas invalidas).
 *
 * Alcance v1 (decidido): consultantes + partnerData/groupData/createNames/notes.
 * Se IGNORA el formato legacy plano (partner/group/dateGroup) y se OMITEN guests.
 *
 * Idempotente: se preservan los ids de WP como ids en Neon (upsert por id);
 * las notas hacen upsert por (consultantId, dateKey, pathKey).
 */
import 'dotenv/config';
import { readFileSync } from 'fs';
import { prisma } from '../lib/prisma';

const DRY_RUN = process.argv.includes('--dry-run') || process.env.DRY_RUN === 'true';

const report = {
  dryRun: DRY_RUN,
  users: 0,
  usersSkipped: 0,
  consultants: 0,
  partnerData: 0,
  partners: 0,
  groups: 0,
  members: 0,
  createNames: 0,
  notes: 0,
  badDates: [] as string[],
  warnings: [] as string[],
};

type WpUser = {
  ID: number;
  email: string;
  first_name?: string;
  last_name?: string;
  scd_last_name?: string;
  birthDate?: string;
  phone?: string;
  consultants?: unknown;
};

function str(v: unknown): string | null {
  if (v === null || v === undefined) return null;
  const s = String(v).trim();
  return s === '' ? null : s;
}

function sanitizeDate(v: unknown): Date | null {
  if (v === null || v === undefined || v === '') return null;
  const s = String(v).trim();
  const m = s.match(/^(\d{4})-(\d{1,2})-(\d{1,2})$/);
  if (!m) {
    report.badDates.push(s);
    return null;
  }
  const [, y, mo, d] = m;
  const date = new Date(Number(y), Number(mo) - 1, Number(d));
  if (Number.isNaN(date.getTime()) || date.getFullYear() !== Number(y)) {
    report.badDates.push(s);
    return null;
  }
  return date;
}

function toInt(v: unknown): number | null {
  if (v === null || v === undefined || v === '') return null;
  const n = Number(v);
  return Number.isFinite(n) ? Math.trunc(n) : null;
}

function normalizeDateKey(k: string): string {
  const parts = k.split('-');
  if (parts.length !== 3) return k;
  const [y, m, d] = parts;
  return `${y}-${m.padStart(2, '0')}-${d.padStart(2, '0')}`;
}

// El meta arithmax_users viene como array de filas (get_user_meta(..., false)),
// y cada fila es la lista de consultantes (o un JSON string). Lo aplanamos.
function extractConsultants(raw: unknown): any[] {
  if (!raw) return [];
  const rows = Array.isArray(raw) ? raw : [raw];
  const out: any[] = [];
  for (const row of rows) {
    let val: any = row;
    if (typeof val === 'string') {
      try {
        val = JSON.parse(val);
      } catch {
        continue;
      }
    }
    if (Array.isArray(val)) out.push(...val);
    else if (val && typeof val === 'object') out.push(val);
  }
  return out;
}

async function migratePartnerData(consultantId: string, list: any[]) {
  for (const pd of list || []) {
    const partnerDataId = str(pd?.id);
    if (!partnerDataId) {
      report.warnings.push(`partnerData sin id en consultante ${consultantId}, omitido`);
      continue;
    }
    report.partnerData += 1;
    const pdFields = {
      name: str(pd.name),
      date: sanitizeDate(pd.date),
      yearMeet: toInt(pd.yearMeet),
    };
    if (!DRY_RUN) {
      await prisma.consultantPartnerData.upsert({
        where: { id: partnerDataId },
        update: { ...pdFields, consultantId },
        create: { id: partnerDataId, consultantId, ...pdFields },
      });
    }
    for (const p of pd.partner || []) {
      const partnerId = str(p?.id);
      if (!partnerId) {
        report.warnings.push(`partner sin id en partnerData ${partnerDataId}, omitido`);
        continue;
      }
      report.partners += 1;
      const partnerFields = {
        names: str(p.names),
        lastName: str(p.lastName),
        scdLastName: str(p.scdLastName),
        date: sanitizeDate(p.date),
      };
      if (!DRY_RUN) {
        await prisma.consultantPartnerDataPartner.upsert({
          where: { id: partnerId },
          update: { ...partnerFields, partnerDataId },
          create: { id: partnerId, partnerDataId, ...partnerFields },
        });
      }
    }
  }
}

async function migrateGroupData(consultantId: string, list: any[]) {
  for (const g of list || []) {
    const groupDataId = str(g?.id);
    if (!groupDataId) {
      report.warnings.push(`groupData sin id en consultante ${consultantId}, omitido`);
      continue;
    }
    report.groups += 1;
    const groupFields = {
      name: str(g.name),
      description: str(g.description),
      date: sanitizeDate(g.date),
      lastInit: toInt(g.lastInit),
    };
    if (!DRY_RUN) {
      await prisma.consultantGroupData.upsert({
        where: { id: groupDataId },
        update: { ...groupFields, consultantId },
        create: { id: groupDataId, consultantId, ...groupFields },
      });
    }
    for (const m of g.members || []) {
      const memberId = str(m?.id);
      if (!memberId) {
        report.warnings.push(`miembro sin id en groupData ${groupDataId}, omitido`);
        continue;
      }
      report.members += 1;
      const memberFields = {
        name: str(m.name),
        lastName: str(m.lastName),
        scdLastName: str(m.scdLastName),
        date: sanitizeDate(m.date),
        dateInit: toInt(m.dateInit),
      };
      if (!DRY_RUN) {
        await prisma.consultantGroupDataMember.upsert({
          where: { id: memberId },
          update: { ...memberFields, groupDataId },
          create: { id: memberId, groupDataId, ...memberFields },
        });
      }
    }
  }
}

async function migrateCreateNames(consultantId: string, list: any[]) {
  let index = 0;
  for (const cn of list || []) {
    // ids estables para los createName sin id (idempotencia en re-corridas).
    const id = str(cn.id) || `${consultantId}-cn-${index}`;
    index += 1;
    report.createNames += 1;
    const createNameFields = {
      name: str(cn.name),
      lastName: str(cn.lastName),
      scdLastName: str(cn.scdLastName),
      birthDate: sanitizeDate(cn.birthDate),
      isPerson: typeof cn.isPerson === 'boolean' ? cn.isPerson : true,
    };
    if (!DRY_RUN) {
      await prisma.consultantCreateName.upsert({
        where: { id },
        update: { ...createNameFields, consultantId },
        create: { id, consultantId, ...createNameFields },
      });
    }
  }
}

async function migrateNotes(consultantId: string, notes: any) {
  if (!notes || typeof notes !== 'object' || Array.isArray(notes)) return;
  for (const [rawDateKey, pages] of Object.entries(notes)) {
    if (!pages || typeof pages !== 'object') continue;
    const dateKey = normalizeDateKey(rawDateKey);
    for (const [pathKey, value] of Object.entries(pages as Record<string, unknown>)) {
      report.notes += 1;
      if (!DRY_RUN) {
        await prisma.consultantNote.upsert({
          where: { consultantId_dateKey_pathKey: { consultantId, dateKey, pathKey } },
          update: { value: str(value) },
          create: { consultantId, dateKey, pathKey, value: str(value) },
        });
      }
    }
  }
}

async function migrateConsultant(c: any, userId: number) {
  const consultantId = str(c?.id);
  if (!consultantId) {
    report.warnings.push(`consultante sin id (usuario ${userId}), omitido`);
    return;
  }
  report.consultants += 1;
  const consultantFields = {
    names: str(c.names),
    lastName: str(c.lastName),
    scdLastName: str(c.scdLastName),
    date: sanitizeDate(c.date),
    email: str(c.email),
    phone: str(c.phone),
    company: str(c.company),
    gender: str(c.gender),
    nationality: str(c.nationality),
  };
  if (!DRY_RUN) {
    await prisma.consultant.upsert({
      where: { id: consultantId },
      update: { ...consultantFields, userId },
      create: { id: consultantId, userId, ...consultantFields },
    });
  }
  await migratePartnerData(consultantId, c.partnerData);
  await migrateGroupData(consultantId, c.groupData);
  await migrateCreateNames(consultantId, c.createNames);
  await migrateNotes(consultantId, c.notes);
}

async function migrateUser(wpUser: WpUser) {
  if (!wpUser?.email) {
    report.warnings.push(`usuario #${wpUser?.ID} sin email, omitido`);
    report.usersSkipped += 1;
    return;
  }
  const wpId = toInt(wpUser.ID);
  if (wpId === null) {
    report.warnings.push(`usuario ${wpUser.email} con ID inválido (${wpUser.ID}), omitido`);
    report.usersSkipped += 1;
    return;
  }
  report.users += 1;
  const profile = {
    firstName: str(wpUser.first_name),
    lastName: str(wpUser.last_name),
    scdLastName: str(wpUser.scd_last_name),
    birthDate: sanitizeDate(wpUser.birthDate),
    phone: str(wpUser.phone),
  };
  let userId = wpId;
  if (!DRY_RUN) {
    const dbUser = await prisma.user.upsert({
      where: { email: wpUser.email },
      update: profile,
      create: { id: wpId, email: wpUser.email, ...profile },
    });
    userId = dbUser.id;
  }
  const consultants = extractConsultants(wpUser.consultants);
  for (const c of consultants) {
    try {
      await migrateConsultant(c, userId);
    } catch (err) {
      report.warnings.push(`consultante ${c?.id} (usuario ${wpUser.email}): ${(err as Error).message}`);
    }
  }
}

async function loadUsers(): Promise<WpUser[]> {
  const file = process.env.WP_USERS_FILE;
  if (file) {
    const parsed = JSON.parse(readFileSync(file, 'utf-8'));
    return Array.isArray(parsed) ? parsed : parsed.users || [];
  }
  const url = process.env.WP_ADMIN_URL;
  const user = process.env.WP_ADMIN_USER;
  const pass = process.env.WP_ADMIN_APP_PASSWORD;
  if (url && user && pass) {
    const auth = Buffer.from(`${user}:${pass}`).toString('base64');
    const res = await (globalThis as any).fetch(url, {
      headers: { Authorization: `Basic ${auth}` },
    });
    if (!res.ok) {
      throw new Error(`Fallo al leer el endpoint WP: HTTP ${res.status}`);
    }
    const data = await res.json();
    return data.users || [];
  }
  throw new Error('Configura WP_USERS_FILE o (WP_ADMIN_URL + WP_ADMIN_USER + WP_ADMIN_APP_PASSWORD)');
}

async function main() {
  const users = await loadUsers();
  console.log(`Usuarios a procesar: ${users.length}${DRY_RUN ? '  [DRY RUN: sin escribir en Neon]' : ''}`);

  for (const wpUser of users) {
    try {
      await migrateUser(wpUser);
    } catch (err) {
      report.usersSkipped += 1;
      report.warnings.push(`usuario ${wpUser?.email} (#${wpUser?.ID}): ${(err as Error).message}`);
    }
  }

  const uniqueBadDates = Array.from(new Set(report.badDates));
  console.log('\n===== REPORTE DE MIGRACIÓN =====');
  console.log(
    JSON.stringify(
      { ...report, badDates: uniqueBadDates, badDatesCount: report.badDates.length },
      null,
      2,
    ),
  );
}

main()
  .catch((err) => {
    console.error('Migración abortada:', err);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
