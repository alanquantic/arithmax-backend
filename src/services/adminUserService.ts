import { Prisma } from '@prisma/client';
import { prisma } from '../lib/prisma';
import { userPublicSelect } from '../models/userModel';
import { generateTempPassword, hashPassword } from '../utils/passwords';
import { MailService } from './mailService';
import { parseDateOnlyInput } from '../utils/date';
import {
  BusinessLogicError,
  NotFoundError,
  ValidationError,
} from '../utils/customErrors';

type LicenseInput = {
  status?: number | null;
  startsAt?: string | null;
  expirationDate?: string | null;
  planId?: string | null;
};

type AdminUserInput = {
  email?: string;
  firstName?: string | null;
  lastName?: string | null;
  scdLastName?: string | null;
  birthDate?: string | null;
  country?: string | null;
  gender?: string | null;
  phone?: string | null;
  companyName?: string | null;
  role?: string;
  mustChangePassword?: boolean;
  newPassword?: string;
  license?: LicenseInput | null;
};

const parseNullableDate = (value: string | null | undefined): Date | null | undefined => {
  if (value === undefined) {
    return undefined; // no tocar
  }
  if (value === null || value === '') {
    return null; // limpiar
  }
  const parsed = parseDateOnlyInput(value);
  if (!parsed) {
    throw new ValidationError(`Fecha invalida: ${value}`);
  }
  return parsed;
};

export class AdminUserService {
  private readonly mailService = new MailService();

  async listUsers(search: string, page: number, pageSize: number) {
    const where: Prisma.UserWhereInput = search
      ? {
          OR: [
            { email: { contains: search, mode: 'insensitive' } },
            { firstName: { contains: search, mode: 'insensitive' } },
            { lastName: { contains: search, mode: 'insensitive' } },
          ],
        }
      : {};

    const [users, total] = await prisma.$transaction([
      prisma.user.findMany({
        where,
        select: userPublicSelect,
        orderBy: { id: 'asc' },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      prisma.user.count({ where }),
    ]);

    return { users, total, page, pageSize };
  }

  async getUser(id: number) {
    const user = await prisma.user.findUnique({
      where: { id },
      select: {
        ...userPublicSelect,
        purchaseEvents: {
          orderBy: { createdAt: 'desc' },
          take: 20,
          select: {
            id: true,
            deliveryId: true,
            event: true,
            status: true,
            action: true,
            error: true,
            createdAt: true,
          },
        },
      },
    });

    if (!user) {
      throw new NotFoundError('Usuario no encontrado');
    }
    return user;
  }

  async createUser(data: AdminUserInput) {
    const email = data.email?.trim().toLowerCase();
    if (!email) {
      throw new ValidationError('Email es requerido');
    }

    const exists = await prisma.user.findFirst({
      where: { email: { equals: email, mode: 'insensitive' } },
      select: { id: true },
    });
    if (exists) {
      throw new ValidationError('Ya existe un usuario con ese email');
    }

    return prisma.user.create({
      data: {
        email,
        firstName: data.firstName ?? null,
        lastName: data.lastName ?? null,
        scdLastName: data.scdLastName ?? null,
        phone: data.phone ?? null,
        country: data.country ?? null,
        gender: data.gender ?? null,
        birthDate: parseNullableDate(data.birthDate) ?? null,
        role: data.role === 'admin' ? 'admin' : 'user',
        mustChangePassword: data.mustChangePassword ?? true,
        passwordHash: data.newPassword ? await hashPassword(data.newPassword) : null,
        ...(data.license
          ? {
              license: {
                create: this.licenseData(data.license),
              },
            }
          : {}),
      },
      select: userPublicSelect,
    });
  }

  async updateUser(id: number, data: AdminUserInput) {
    await this.ensureExists(id);

    if (data.email !== undefined && !data.email?.trim()) {
      throw new ValidationError('Email no puede quedar vacio');
    }

    return prisma.user.update({
      where: { id },
      data: {
        ...(data.email !== undefined ? { email: data.email.trim().toLowerCase() } : {}),
        ...(data.firstName !== undefined ? { firstName: data.firstName } : {}),
        ...(data.lastName !== undefined ? { lastName: data.lastName } : {}),
        ...(data.scdLastName !== undefined ? { scdLastName: data.scdLastName } : {}),
        ...(data.phone !== undefined ? { phone: data.phone } : {}),
        ...(data.country !== undefined ? { country: data.country } : {}),
        ...(data.gender !== undefined ? { gender: data.gender } : {}),
        ...(data.birthDate !== undefined
          ? { birthDate: parseNullableDate(data.birthDate) }
          : {}),
        ...(data.role !== undefined
          ? { role: data.role === 'admin' ? 'admin' : 'user' }
          : {}),
        ...(data.mustChangePassword !== undefined
          ? { mustChangePassword: data.mustChangePassword }
          : {}),
        ...(data.newPassword
          ? { passwordHash: await hashPassword(data.newPassword) }
          : {}),
        ...(data.license
          ? {
              license: {
                upsert: {
                  update: this.licenseData(data.license),
                  create: this.licenseData(data.license),
                },
              },
            }
          : {}),
      },
      select: userPublicSelect,
    });
  }

  async deleteUser(id: number) {
    await this.ensureExists(id);
    // El schema define onDelete: Cascade para license/consultants/guests/tokens
    await prisma.user.delete({ where: { id } });
    return { deleted: true };
  }

  // Alta manual (compra fuera del webhook): genera una contraseña temporal y
  // envia el mismo correo de bienvenida que el webhook, seguido del agradecimiento
  async sendAccess(id: number) {
    await this.ensureExists(id);
    const user = await prisma.user.findUniqueOrThrow({
      where: { id },
      select: {
        email: true,
        firstName: true,
        passwordHash: true,
        mustChangePassword: true,
        license: { select: { status: true, expirationDate: true } },
      },
    });

    // El correo afirma que la licencia esta activa: no enviarlo si no lo esta
    const expiresAt = user.license?.expirationDate ?? null;
    if (user.license?.status !== 1 || (expiresAt && expiresAt < new Date())) {
      throw new ValidationError(
        'El usuario no tiene una licencia activa y vigente; asignala antes de enviar los accesos'
      );
    }

    const tempPassword = generateTempPassword();
    await prisma.user.update({
      where: { id },
      data: {
        passwordHash: await hashPassword(tempPassword),
        mustChangePassword: true,
      },
    });

    const mail = await this.mailService.sendWelcome(user.email, {
      firstName: user.firstName,
      tempPassword,
      expiresAt,
    });

    if (!mail.ok) {
      // Sin correo el cliente nunca veria la contraseña nueva: se restaura la anterior
      await prisma.user.update({
        where: { id },
        data: {
          passwordHash: user.passwordHash,
          mustChangePassword: user.mustChangePassword,
        },
      });
      throw new BusinessLogicError(
        `No se pudo enviar el correo de accesos: ${mail.error}`
      );
    }

    const thanks = await this.mailService.sendThankYou(user.email, {
      firstName: user.firstName,
    });

    return {
      sent: true,
      email: user.email,
      thankYouSent: thanks.ok,
      ...(thanks.ok ? {} : { thankYouError: thanks.error }),
    };
  }

  async listPurchaseEvents(limit: number) {
    return prisma.purchaseEvent.findMany({
      orderBy: { createdAt: 'desc' },
      take: limit,
      select: {
        id: true,
        deliveryId: true,
        event: true,
        status: true,
        action: true,
        error: true,
        createdAt: true,
        user: { select: { id: true, email: true } },
      },
    });
  }

  private licenseData(license: LicenseInput) {
    return {
      status: license.status ?? null,
      planId: license.planId ?? null,
      startsAt: parseNullableDate(license.startsAt) ?? null,
      expirationDate: parseNullableDate(license.expirationDate) ?? null,
    };
  }

  private async ensureExists(id: number) {
    if (!id || Number.isNaN(id)) {
      throw new ValidationError('ID de usuario invalido');
    }
    const user = await prisma.user.findUnique({ where: { id }, select: { id: true } });
    if (!user) {
      throw new NotFoundError('Usuario no encontrado');
    }
  }
}
