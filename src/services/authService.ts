import * as crypto from 'crypto';
import { prisma } from '../lib/prisma';
import { UserRepository } from '../repositories/userRepository';
import { AuthValidator } from '../validators/authValidator';
import { MailService } from './mailService';
import {
  NotFoundError,
  UnauthorizedError,
  ValidationError,
} from '../utils/customErrors';
import { hashPassword, sha256Hex, verifyPassword } from '../utils/passwords';

const RESET_TOKEN_TTL_MS = 60 * 60 * 1000; // 1 hora
const MIN_PASSWORD_LENGTH = 8;

const jwt: {
  sign: (
    payload: string | Buffer | object,
    secret: string,
    options?: { expiresIn?: string | number }
  ) => string;
} = require('jsonwebtoken');

type LoginInput = {
  username: string;
  password: string;
};

type WordPressLoginResponse = {
  license?: {
    id?: number;
    status?: string;
    expirationDate?: string;
    licenseId?: string;
  };
  app_version?: string;
};

export class AuthService {
  private readonly userRepository: UserRepository;
  private readonly mailService = new MailService();

  constructor() {
    this.userRepository = new UserRepository();
  }

  async login(data: LoginInput) {
    AuthValidator.validateLoginData(data as unknown as Record<string, unknown>);

    // Default 'wordpress' durante la transicion: un deploy sin la variable
    // configurada conserva el login actual en vez de activar el nuevo
    const provider = (process.env.AUTH_PROVIDER ?? 'wordpress').toLowerCase();
    if (provider === 'wordpress') {
      return this.loginWithWordPress(data);
    }

    return this.loginLocal(data);
  }

  private async loginLocal(data: LoginInput) {
    const authUser = await this.userRepository.findAuthByEmail(data.username);

    // Mismo mensaje si el usuario no existe, no tiene contraseña o esta es
    // incorrecta: no revelar cuales emails estan registrados
    if (!authUser?.passwordHash) {
      throw new UnauthorizedError('Credenciales invalidas');
    }

    const check = await verifyPassword(data.password, authUser.passwordHash);
    if (!check.valid) {
      throw new UnauthorizedError('Credenciales invalidas');
    }

    await this.userRepository.recordLogin(
      authUser.id,
      check.needsRehash ? await hashPassword(data.password) : undefined
    );

    const user = await this.userRepository.findById(authUser.id);

    return {
      user,
      token: this.generateToken(authUser.id, authUser.email),
      license: this.toLicenseResponse(user.license),
      app_version: process.env.APP_VERSION ?? null,
    };
  }

  // Mantiene la forma que el frontend recibia de WordPress
  private toLicenseResponse(
    license: {
      id: number;
      status: number | null;
      expirationDate: Date | null;
      planId: string | null;
    } | null
  ) {
    if (!license) {
      return null;
    }

    return {
      id: license.id,
      status: license.status === 1 ? 'active' : 'inactive',
      expirationDate: license.expirationDate?.toISOString() ?? null,
      licenseId: license.planId ?? null,
    };
  }

  // Flujo legacy (AUTH_PROVIDER=wordpress); se elimina en el corte definitivo
  private async loginWithWordPress(data: LoginInput) {
    const wordpressResponse = await this.loginAgainstWordPress(data);
    const user = await this.userRepository.upsertFromWordPress({
      email: data.username,
      license: this.normalizeWordPressLicense(wordpressResponse),
    });

    return {
      user,
      token: this.generateToken(user.id, user.email),
      license: wordpressResponse.license ?? null,
      app_version: wordpressResponse.app_version ?? null,
    };
  }

  async me(userId: number) {
    if (!userId) {
      throw new ValidationError('User ID is required');
    }

    return this.userRepository.findById(userId);
  }

  // Siempre responde igual exista o no el email, para no revelar cuentas
  async forgotPassword(email: string) {
    if (!email || typeof email !== 'string') {
      throw new ValidationError('Email es requerido');
    }

    const user = await this.userRepository.findAuthByEmail(email);
    if (user) {
      const token = crypto.randomBytes(32).toString('hex');

      await prisma.passwordResetToken.create({
        data: {
          userId: user.id,
          tokenHash: sha256Hex(token),
          expiresAt: new Date(Date.now() + RESET_TOKEN_TTL_MS),
        },
      });

      const baseUrl =
        process.env.RESET_PASSWORD_URL ?? process.env.SOFTWARE_URL ?? '';
      const mail = await this.mailService.sendPasswordReset(user.email, {
        resetUrl: `${baseUrl}?token=${token}`,
      });
      if (!mail.ok) {
        // eslint-disable-next-line no-console
        console.error(`Fallo el correo de reset para ${user.email}: ${mail.error}`);
      }
    }

    return {
      message:
        'Si el correo esta registrado, recibiras un enlace para restablecer tu contraseña',
    };
  }

  async resetPassword(token: string, newPassword: string) {
    if (!token || typeof token !== 'string') {
      throw new ValidationError('Token es requerido');
    }
    this.validatePasswordPolicy(newPassword);

    const resetToken = await prisma.passwordResetToken.findUnique({
      where: { tokenHash: sha256Hex(token) },
    });

    if (!resetToken || resetToken.usedAt || resetToken.expiresAt < new Date()) {
      throw new UnauthorizedError('Token invalido o expirado');
    }

    const passwordHash = await hashPassword(newPassword);
    await prisma.$transaction([
      prisma.user.update({
        where: { id: resetToken.userId },
        data: { passwordHash, mustChangePassword: false },
      }),
      prisma.passwordResetToken.update({
        where: { id: resetToken.id },
        data: { usedAt: new Date() },
      }),
    ]);

    return { message: 'Contraseña actualizada' };
  }

  async changePassword(userId: number, currentPassword: string, newPassword: string) {
    if (!userId) {
      throw new ValidationError('User ID is required');
    }
    if (!currentPassword || typeof currentPassword !== 'string') {
      throw new ValidationError('La contraseña actual es requerida');
    }
    this.validatePasswordPolicy(newPassword);

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { passwordHash: true },
    });
    if (!user?.passwordHash) {
      throw new UnauthorizedError('Credenciales invalidas');
    }

    const check = await verifyPassword(currentPassword, user.passwordHash);
    if (!check.valid) {
      throw new UnauthorizedError('La contraseña actual es incorrecta');
    }

    await prisma.user.update({
      where: { id: userId },
      data: {
        passwordHash: await hashPassword(newPassword),
        mustChangePassword: false,
      },
    });

    return { message: 'Contraseña actualizada' };
  }

  private validatePasswordPolicy(password: unknown): void {
    if (
      !password ||
      typeof password !== 'string' ||
      password.length < MIN_PASSWORD_LENGTH
    ) {
      throw new ValidationError(
        `La contraseña debe tener al menos ${MIN_PASSWORD_LENGTH} caracteres`
      );
    }
  }

  private generateToken(userId: number, email: string): string {
    const secret = process.env.JWT_SECRET;

    if (!secret) {
      throw new ValidationError('JWT_SECRET is not configured');
    }

    return jwt.sign({ userId, email }, secret, {
      expiresIn: '7d',
    });
  }

  private async loginAgainstWordPress(
    data: LoginInput
  ): Promise<WordPressLoginResponse> {
    const wordpressBaseUrl = process.env.WORDPRESS_API_URL;

    if (!wordpressBaseUrl) {
      throw new ValidationError('WORDPRESS_API_URL is not configured');
    }

    const response = await fetch(this.buildWordPressLoginUrl(wordpressBaseUrl), {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });

    const responseData = (await response.json()) as WordPressLoginResponse & {
      message?: string;
    };

    if (!response.ok) {
      throw new NotFoundError(
        responseData.message ?? 'WordPress authentication failed'
      );
    }

    return responseData;
  }

  private buildWordPressLoginUrl(wordpressBaseUrl: string): string {
    const normalizedBaseUrl = wordpressBaseUrl.replace(/\/+$/, '');

    if (normalizedBaseUrl.endsWith('/wp-json/app/v3')) {
      return `${normalizedBaseUrl}/auth/login`;
    }

    if (normalizedBaseUrl.endsWith('/wp-json')) {
      return `${normalizedBaseUrl}/app/v3/auth/login`;
    }

    return `${normalizedBaseUrl}/wp-json/app/v3/auth/login`;
  }

  private normalizeWordPressLicense(data: WordPressLoginResponse): {
    status?: number | null;
    expirationDate?: Date | null;
    planId?: string | null;
  } | null {
    if (!data.license) {
      return null;
    }

    return {
      status: this.mapLicenseStatus(data.license.status),
      expirationDate: data.license.expirationDate
        ? new Date(data.license.expirationDate)
        : null,
      planId: data.license.licenseId ?? null,
    };
  }

  private mapLicenseStatus(status?: string): number | null {
    if (!status) {
      return null;
    }

    switch (status.toLowerCase()) {
      case 'active':
        return 1;
      case 'inactive':
      case 'expired':
        return 0;
      default:
        return null;
    }
  }
}
