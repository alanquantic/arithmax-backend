/* eslint-disable no-console */
import { Prisma } from '@prisma/client';
import { prisma } from '../lib/prisma';
import { MailService } from './mailService';
import { ValidationError } from '../utils/customErrors';
import { generateTempPassword, hashPassword } from '../utils/passwords';
import { parseDateOnlyInput } from '../utils/date';

export type StoreWebhookPayload = {
  event?: string;
  kind?: string;
  deliveryId?: string;
  sentAt?: string;
  customer?: {
    email?: string;
    firstName?: string;
    lastName?: string;
    fullName?: string;
    phone?: string;
    birthDate?: string;
  };
  order?: {
    paidAt?: string;
  };
  triggeredBy?: Array<{
    name?: string;
    sku?: string;
    access?: {
      planCode?: string;
      durationMonths?: number;
      startsAt?: string;
      expiresAt?: string;
    } | null;
  }>;
};

export type WebhookProcessResult = {
  status: 'processed' | 'skipped' | 'already_processed';
  action?: 'user_created' | 'license_renewed';
  reason?: string;
  userId?: number;
  expiresAt?: string;
};

export class PurchaseWebhookService {
  private readonly mailService = new MailService();

  async process(payload: StoreWebhookPayload): Promise<WebhookProcessResult> {
    const deliveryId = payload.deliveryId?.trim();
    if (!deliveryId) {
      throw new ValidationError('deliveryId es requerido');
    }

    // Idempotencia: un deliveryId ya procesado no se vuelve a aplicar
    const existing = await prisma.purchaseEvent.findUnique({
      where: { deliveryId },
    });
    if (existing && existing.status !== 'failed') {
      return { status: 'already_processed', userId: existing.userId ?? undefined };
    }

    const record = async (
      data: Omit<Prisma.PurchaseEventUncheckedCreateInput, 'deliveryId' | 'event' | 'payload'>
    ) => {
      const base = {
        event: payload.event ?? 'unknown',
        payload: payload as unknown as Prisma.InputJsonValue,
        processedAt: new Date(),
        ...data,
      };
      await prisma.purchaseEvent.upsert({
        where: { deliveryId },
        update: base,
        create: { deliveryId, ...base },
      });
    };

    try {
      const result = await this.apply(payload);
      if (result.status === 'skipped') {
        await record({ status: 'skipped', error: result.reason ?? null });
      } else {
        await record({
          status: 'processed',
          action: result.action,
          userId: result.userId ?? null,
          error: result.reason ?? null,
        });
      }
      return result;
    } catch (error) {
      await record({ status: 'failed', error: (error as Error).message }).catch(
        (recordError) =>
          console.error('No se pudo registrar el purchase event:', recordError)
      );
      throw error;
    }
  }

  private async apply(payload: StoreWebhookPayload): Promise<WebhookProcessResult> {
    if (payload.event !== 'purchase.completed' || payload.kind !== 'license') {
      return {
        status: 'skipped',
        reason: `Evento no soportado: ${payload.event}/${payload.kind}`,
      };
    }

    const email = payload.customer?.email?.trim().toLowerCase();
    if (!email) {
      return { status: 'skipped', reason: 'Payload sin customer.email' };
    }

    // Solo los items con access son licencias a provisionar; si hay varias en
    // un pedido se aplica la de mayor duracion
    const licenseItems = (payload.triggeredBy ?? []).filter(
      (item) => item?.access && Number(item.access.durationMonths) > 0
    );
    if (licenseItems.length === 0) {
      return { status: 'skipped', reason: 'Sin items de licencia en triggeredBy' };
    }

    const chosen = licenseItems.reduce((best, item) =>
      Number(item.access!.durationMonths) > Number(best.access!.durationMonths)
        ? item
        : best
    );
    const months = Number(chosen.access!.durationMonths);
    const planCode = chosen.access!.planCode ?? chosen.sku ?? null;
    const paidAt = payload.order?.paidAt ? new Date(payload.order.paidAt) : new Date();
    const skippedItems = licenseItems.length - 1;
    const note =
      skippedItems > 0
        ? `Pedido con ${licenseItems.length} licencias; se aplico la de mayor duracion (${months} meses)`
        : undefined;

    const user = await prisma.user.findFirst({
      where: { email: { equals: email, mode: 'insensitive' } },
      select: {
        id: true,
        email: true,
        firstName: true,
        license: { select: { expirationDate: true, startsAt: true } },
      },
    });

    if (user) {
      return this.renewLicense(user, { months, planCode, paidAt, note });
    }

    return this.createUserWithLicense(email, payload, { months, planCode, paidAt, note });
  }

  private async renewLicense(
    user: {
      id: number;
      email: string;
      firstName: string | null;
      license: { expirationDate: Date | null; startsAt: Date | null } | null;
    },
    data: { months: number; planCode: string | null; paidAt: Date; note?: string }
  ): Promise<WebhookProcessResult> {
    // Renovar nunca resta tiempo: se extiende desde el vencimiento vigente o
    // desde hoy, lo que sea mayor
    const now = new Date();
    const currentExpiry = user.license?.expirationDate;
    const base = currentExpiry && currentExpiry > now ? currentExpiry : now;
    const newExpiry = addMonths(base, data.months);

    await prisma.license.upsert({
      where: { userId: user.id },
      update: {
        status: 1,
        planId: data.planCode,
        expirationDate: newExpiry,
        startsAt: user.license?.startsAt ?? data.paidAt,
      },
      create: {
        userId: user.id,
        status: 1,
        planId: data.planCode,
        startsAt: data.paidAt,
        expirationDate: newExpiry,
      },
    });

    const mail = await this.mailService.sendRenewal(user.email, {
      firstName: user.firstName,
      expiresAt: newExpiry,
    });

    return {
      status: 'processed',
      action: 'license_renewed',
      userId: user.id,
      expiresAt: newExpiry.toISOString(),
      reason: joinNotes(data.note, mail.ok ? undefined : `Correo fallo: ${mail.error}`),
    };
  }

  private async createUserWithLicense(
    email: string,
    payload: StoreWebhookPayload,
    data: { months: number; planCode: string | null; paidAt: Date; note?: string }
  ): Promise<WebhookProcessResult> {
    const customer = payload.customer ?? {};
    const tempPassword = generateTempPassword();
    const passwordHash = await hashPassword(tempPassword);
    const expiresAt = addMonths(data.paidAt, data.months);

    const created = await prisma.user.create({
      data: {
        email,
        passwordHash,
        mustChangePassword: true,
        firstName: customer.firstName ?? customer.fullName ?? null,
        lastName: customer.lastName ?? null,
        phone: customer.phone ?? null,
        birthDate: parseDateOnlyInput(customer.birthDate) ?? null,
        license: {
          create: {
            status: 1,
            planId: data.planCode,
            startsAt: data.paidAt,
            expirationDate: expiresAt,
          },
        },
      },
      select: { id: true },
    });

    const mail = await this.mailService.sendWelcome(email, {
      firstName: customer.firstName,
      tempPassword,
      expiresAt,
    });

    return {
      status: 'processed',
      action: 'user_created',
      userId: created.id,
      expiresAt: expiresAt.toISOString(),
      reason: joinNotes(data.note, mail.ok ? undefined : `Correo fallo: ${mail.error}`),
    };
  }
}

// Suma meses clavando el dia; si el dia no existe en el mes destino (31 -> feb),
// se ajusta al ultimo dia de ese mes
function addMonths(date: Date, months: number): Date {
  const result = new Date(date);
  const day = result.getDate();
  result.setDate(1);
  result.setMonth(result.getMonth() + months);
  const lastDay = new Date(result.getFullYear(), result.getMonth() + 1, 0).getDate();
  result.setDate(Math.min(day, lastDay));
  return result;
}

function joinNotes(...notes: (string | undefined)[]): string | undefined {
  const joined = notes.filter(Boolean).join(' | ');
  return joined || undefined;
}
