/* eslint-disable no-await-in-loop, no-restricted-syntax, no-console */
/**
 * Importa los hashes de contraseña de un dump SQL de WordPress (mysqldump,
 * opcionalmente .gz) hacia la columna users.password_hash de Neon.
 *
 * Uso:
 *   npx ts-node src/scripts/import-wp-hashes.ts --file="C:/ruta/dump.sql.gz" [--dry-run] [--no-create-missing]
 *   (o WP_DUMP_FILE en .env)
 *
 * Reglas:
 *   - Empareja por email (case-insensitive).
 *   - Solo escribe password_hash si esta vacio o contiene un hash legacy de WP
 *     ($P$/$H$/$wp$). NUNCA sobrescribe un bcrypt propio ($2a$/$2b$).
 *   - Usuarios del dump que no existen en Neon se crean (con su id de WP si
 *     esta libre) salvo --no-create-missing.
 *   - Idempotente: re-ejecutar no duplica ni degrada hashes.
 */
import 'dotenv/config';
import { readFileSync } from 'fs';
import { gunzipSync } from 'zlib';
import { prisma } from '../lib/prisma';

const DRY_RUN = process.argv.includes('--dry-run') || process.env.DRY_RUN === 'true';
const CREATE_MISSING = !process.argv.includes('--no-create-missing');

const fileArg = process.argv.find((a) => a.startsWith('--file='));
const DUMP_FILE = fileArg?.slice('--file='.length) ?? process.env.WP_DUMP_FILE;

type WpUserRow = {
  id: number;
  email: string;
  pass: string;
  displayName: string | null;
  registered: Date | null;
};

const report = {
  dryRun: DRY_RUN,
  wpUsersInDump: 0,
  hashFormats: { wpBcrypt: 0, phpass: 0, other: 0, empty: 0 },
  hashesImported: 0,
  hashesAlreadyLocal: 0,
  usersCreated: 0,
  skippedNoEmail: 0,
  neonUsersWithoutHashAfter: [] as string[],
  warnings: [] as string[],
};

function loadDump(path: string): string {
  const buf = readFileSync(path);
  const isGzip = buf.length > 2 && buf[0] === 0x1f && buf[1] === 0x8b;
  return (isGzip ? gunzipSync(buf) : buf).toString('utf8');
}

function findUsersTable(sql: string): string {
  const names = [...sql.matchAll(/CREATE TABLE `([^`]+)`/g)].map((m) => m[1]);
  const table = names.find((n) => n.endsWith('users') && !n.endsWith('usermeta'));
  if (!table) {
    throw new Error(`No se encontro tabla *users en el dump. Tablas: ${names.join(', ')}`);
  }
  return table;
}

function parseColumns(sql: string, table: string): string[] {
  const start = sql.indexOf(`CREATE TABLE \`${table}\``);
  if (start === -1) {
    throw new Error(`CREATE TABLE \`${table}\` no encontrado`);
  }
  const body = sql.slice(start, sql.indexOf(';', start));
  const cols: string[] = [];
  for (const line of body.split('\n')) {
    const m = line.match(/^\s*`(\w+)`/);
    if (m) {
      cols.push(m[1]);
    }
  }
  if (cols.length === 0) {
    throw new Error(`No se pudieron leer columnas de ${table}`);
  }
  return cols;
}

const ESCAPES: Record<string, string> = {
  '0': '\0',
  n: '\n',
  r: '\r',
  t: '\t',
  Z: '\x1a',
  "'": "'",
  '"': '"',
  '\\': '\\',
};

// Extrae las filas de todos los INSERT INTO `table` del dump.
// Parser de estado minimo para VALUES (a,'b',NULL),(...);
function parseInsertRows(sql: string, table: string): (string | null)[][] {
  const rows: (string | null)[][] = [];
  const marker = `INSERT INTO \`${table}\``;
  let cursor = 0;

  for (;;) {
    const insertAt = sql.indexOf(marker, cursor);
    if (insertAt === -1) {
      break;
    }
    let i = sql.indexOf('VALUES', insertAt) + 'VALUES'.length;

    statement: for (;;) {
      while (i < sql.length && /[\s,]/.test(sql[i])) i++;
      if (sql[i] === ';' || i >= sql.length) {
        cursor = i;
        break;
      }
      if (sql[i] !== '(') {
        throw new Error(`Parser: se esperaba '(' en offset ${i}`);
      }
      i++;
      const row: (string | null)[] = [];

      for (;;) {
        while (i < sql.length && /\s/.test(sql[i])) i++;

        if (sql[i] === "'") {
          i++;
          let value = '';
          for (;;) {
            const ch = sql[i];
            if (ch === '\\' && ESCAPES[sql[i + 1]] !== undefined) {
              value += ESCAPES[sql[i + 1]];
              i += 2;
            } else if (ch === "'" && sql[i + 1] === "'") {
              value += "'";
              i += 2;
            } else if (ch === "'") {
              i++;
              break;
            } else {
              value += ch;
              i++;
            }
          }
          row.push(value);
        } else {
          let raw = '';
          while (i < sql.length && sql[i] !== ',' && sql[i] !== ')') {
            raw += sql[i];
            i++;
          }
          raw = raw.trim();
          row.push(raw.toUpperCase() === 'NULL' ? null : raw);
        }

        while (i < sql.length && /\s/.test(sql[i])) i++;
        if (sql[i] === ',') {
          i++;
          continue;
        }
        if (sql[i] === ')') {
          i++;
          rows.push(row);
          break;
        }
        throw new Error(`Parser: caracter inesperado '${sql[i]}' en offset ${i}`);
      }

      while (i < sql.length && /\s/.test(sql[i])) i++;
      if (sql[i] === ',') {
        i++;
        continue;
      }
      if (sql[i] === ';') {
        cursor = i;
        break statement;
      }
    }
  }

  return rows;
}

function classifyHash(hash: string): void {
  if (!hash) {
    report.hashFormats.empty++;
  } else if (hash.startsWith('$wp$')) {
    report.hashFormats.wpBcrypt++;
  } else if (hash.startsWith('$P$') || hash.startsWith('$H$')) {
    report.hashFormats.phpass++;
  } else {
    report.hashFormats.other++;
    report.warnings.push(`Formato de hash no reconocido: ${hash.slice(0, 8)}...`);
  }
}

function isLegacyOrEmpty(hash: string | null): boolean {
  return !hash || /^(\$P\$|\$H\$|\$wp\$)/.test(hash);
}

async function main() {
  if (!DUMP_FILE) {
    throw new Error('Falta --file=<ruta al dump> o WP_DUMP_FILE en .env');
  }

  console.log(`Leyendo dump: ${DUMP_FILE}${DRY_RUN ? ' (dry-run)' : ''}`);
  const sql = loadDump(DUMP_FILE);

  const usersTable = findUsersTable(sql);
  const prefix = usersTable.slice(0, -'users'.length);
  console.log(`Tabla de usuarios: ${usersTable} (prefijo '${prefix}')`);

  const cols = parseColumns(sql, usersTable);
  const idx = {
    id: cols.indexOf('ID'),
    pass: cols.indexOf('user_pass'),
    email: cols.indexOf('user_email'),
    displayName: cols.indexOf('display_name'),
    registered: cols.indexOf('user_registered'),
  };
  if (idx.id === -1 || idx.pass === -1 || idx.email === -1) {
    throw new Error(`Columnas ID/user_pass/user_email no encontradas en ${usersTable}: ${cols.join(', ')}`);
  }

  const wpUsers: WpUserRow[] = parseInsertRows(sql, usersTable).map((row) => ({
    id: Number(row[idx.id]),
    email: String(row[idx.email] ?? '').trim().toLowerCase(),
    pass: String(row[idx.pass] ?? ''),
    displayName: idx.displayName !== -1 ? row[idx.displayName] : null,
    registered:
      idx.registered !== -1 && row[idx.registered]
        ? new Date(String(row[idx.registered]).replace(' ', 'T') + 'Z')
        : null,
  }));
  report.wpUsersInDump = wpUsers.length;

  // first_name / last_name desde usermeta para usuarios que haya que crear
  const metaTable = `${prefix}usermeta`;
  const names = new Map<number, { firstName?: string; lastName?: string }>();
  if (sql.includes(`CREATE TABLE \`${metaTable}\``)) {
    const metaCols = parseColumns(sql, metaTable);
    const mIdx = {
      userId: metaCols.indexOf('user_id'),
      key: metaCols.indexOf('meta_key'),
      value: metaCols.indexOf('meta_value'),
    };
    for (const row of parseInsertRows(sql, metaTable)) {
      const key = row[mIdx.key];
      if (key !== 'first_name' && key !== 'last_name') {
        continue;
      }
      const userId = Number(row[mIdx.userId]);
      const value = String(row[mIdx.value] ?? '').trim();
      if (!value) {
        continue;
      }
      const entry = names.get(userId) ?? {};
      if (key === 'first_name') {
        entry.firstName = value;
      } else {
        entry.lastName = value;
      }
      names.set(userId, entry);
    }
  } else {
    report.warnings.push(`Tabla ${metaTable} no encontrada; usuarios nuevos sin nombre`);
  }

  for (const wpUser of wpUsers) {
    if (!wpUser.email) {
      report.skippedNoEmail++;
      report.warnings.push(`Usuario WP ${wpUser.id} sin email, omitido`);
      continue;
    }
    classifyHash(wpUser.pass);
    if (!wpUser.pass) {
      report.warnings.push(`Usuario WP ${wpUser.id} (${wpUser.email}) sin hash, omitido`);
      continue;
    }

    const neonUser = await prisma.user.findFirst({
      where: { email: { equals: wpUser.email, mode: 'insensitive' } },
      select: { id: true, passwordHash: true },
    });

    if (neonUser) {
      if (isLegacyOrEmpty(neonUser.passwordHash)) {
        if (!DRY_RUN) {
          await prisma.user.update({
            where: { id: neonUser.id },
            data: { passwordHash: wpUser.pass },
          });
        }
        report.hashesImported++;
      } else {
        report.hashesAlreadyLocal++;
      }
      continue;
    }

    if (!CREATE_MISSING) {
      report.warnings.push(`WP ${wpUser.id} (${wpUser.email}) no existe en Neon (no creado)`);
      continue;
    }

    const meta = names.get(wpUser.id) ?? {};
    if (!DRY_RUN) {
      const idTaken = await prisma.user.findUnique({
        where: { id: wpUser.id },
        select: { id: true },
      });
      await prisma.user.create({
        data: {
          ...(idTaken ? {} : { id: wpUser.id }),
          email: wpUser.email,
          passwordHash: wpUser.pass,
          firstName: meta.firstName ?? wpUser.displayName ?? null,
          lastName: meta.lastName ?? null,
          ...(wpUser.registered ? { createdAt: wpUser.registered } : {}),
        },
      });
    }
    report.usersCreated++;
  }

  if (!DRY_RUN) {
    const withoutHash = await prisma.user.findMany({
      where: { passwordHash: null },
      select: { email: true },
      orderBy: { id: 'asc' },
    });
    report.neonUsersWithoutHashAfter = withoutHash.map((u) => u.email);
  }

  console.log(JSON.stringify(report, null, 2));
}

main()
  .catch((error) => {
    console.error('Error en importacion:', error);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
