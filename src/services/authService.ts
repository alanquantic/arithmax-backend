import { Prisma } from '@prisma/client';
import jwt from 'jsonwebtoken';
import { UserRepository } from '../repositories/userRepository';
import { AuthValidator } from '../validators/authValidator';
import { NotFoundError, ValidationError } from '../utils/customErrors';

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

  constructor() {
    this.userRepository = new UserRepository();
  }

  async login(data: LoginInput) {
    AuthValidator.validateLoginData(data as unknown as Record<string, unknown>);

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

    const response = await fetch(`${wordpressBaseUrl}/wp-json/app/v3/auth/login`, {
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
