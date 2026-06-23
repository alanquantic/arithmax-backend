import { Prisma, PrismaClient } from '@prisma/client';
import { userPublicSelect } from '../models/userModel';
import {
  ValidationError,
  NotFoundError,
  DatabaseError,
} from '../utils/customErrors';

const prisma = new PrismaClient();

export class UserRepository {
  async create(data: Prisma.UserCreateInput) {
    if (!data) {
      throw new ValidationError('User data is required');
    }

    try {
      return await prisma.user.create({
        data: data,
        select: userPublicSelect,
      });
    } catch (error) {
      throw new DatabaseError('Failed to create user', error as Error);
    }
  }

  async update(id: number, data: Prisma.UserUpdateInput) {
    if (!id || isNaN(Number(id))) {
      throw new ValidationError('Valid user ID is required');
    }

    try {
      return await prisma.user.update({
        where: { id: Number(id) },
        data: data,
        select: userPublicSelect,
      });
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === 'P2025'
      ) {
        throw new NotFoundError('User not found');
      }
      throw new DatabaseError('Failed to update user', error as Error);
    }
  }

  findAll() {
    return prisma.user.findMany({
      select: {
        ...userPublicSelect,
        license: true,
      },
      orderBy: {
        id: 'asc',
      },
    });
  }

  async findById(id: number) {
    if (!id || isNaN(Number(id))) {
      throw new ValidationError('Valid user ID is required');
    }

    try {
      const user = await prisma.user.findUnique({
        where: { id: Number(id) },
        select: userPublicSelect,
      });

      if (!user) {
        throw new NotFoundError('User not found');
      }

      return user;
    } catch (error) {
      if (error instanceof NotFoundError) {
        throw error;
      }
      throw new DatabaseError('Failed to find user', error as Error);
    }
  }

  async findAuthByEmail(email: string) {
    if (!email) {
      throw new ValidationError('Email is required');
    }

    try {
      return await prisma.user.findUnique({
        where: { email },
      });
    } catch (error) {
      throw new DatabaseError('Failed to find user by email', error as Error);
    }
  }

  async findPublicByEmail(email: string) {
    if (!email) {
      throw new ValidationError('Email is required');
    }

    try {
      const user = await prisma.user.findUnique({
        where: { email },
        select: userPublicSelect,
      });

      if (!user) {
        throw new NotFoundError('User not found');
      }

      return user;
    } catch (error) {
      if (error instanceof NotFoundError) {
        throw error;
      }

      throw new DatabaseError('Failed to find user by email', error as Error);
    }
  }

  async getNextId(): Promise<number> {
    try {
      const lastUser = await prisma.user.findFirst({
        orderBy: {
          id: 'desc',
        },
        select: {
          id: true,
        },
      });

      return (lastUser?.id ?? 0) + 1;
    } catch (error) {
      throw new DatabaseError('Failed to get next user ID', error as Error);
    }
  }

  async upsertFromWordPress(data: {
    id?: number | null;
    email: string;
    firstName?: string | null;
    lastName?: string | null;
    scdLastName?: string | null;
    birthDate?: Date | null;
    country?: string | null;
    gender?: string | null;
    phone?: string | null;
    avatar?: string | null;
    companyName?: string | null;
    companyDirection?: string | null;
    companyPhone?: string | null;
    companyWebsite?: string | null;
    companyLogo?: string | null;
    devices?: Prisma.InputJsonValue;
    license?: {
      status?: number | null;
      expirationDate?: Date | null;
      planId?: string | null;
    } | null;
  }) {
    try {
      const existingUser = await prisma.user.findUnique({
        where: { email: data.email },
        select: { id: true },
      });

      const userId = existingUser?.id ?? data.id ?? (await this.getNextId());

      return await prisma.user.upsert({
        where: { email: data.email },
        update: {
          email: data.email,
          firstName: data.firstName,
          lastName: data.lastName,
          scdLastName: data.scdLastName,
          birthDate: data.birthDate,
          country: data.country,
          gender: data.gender,
          phone: data.phone,
          avatar: data.avatar,
          companyName: data.companyName,
          companyDirection: data.companyDirection,
          companyPhone: data.companyPhone,
          companyWebsite: data.companyWebsite,
          companyLogo: data.companyLogo,
          devices: data.devices,
          license: data.license
            ? {
                upsert: {
                  update: {
                    status: data.license.status,
                    expirationDate: data.license.expirationDate,
                    planId: data.license.planId,
                  },
                  create: {
                    status: data.license.status,
                    expirationDate: data.license.expirationDate,
                    planId: data.license.planId,
                  },
                },
              }
            : undefined,
        },
        create: {
          id: userId,
          email: data.email,
          firstName: data.firstName,
          lastName: data.lastName,
          scdLastName: data.scdLastName,
          birthDate: data.birthDate,
          country: data.country,
          gender: data.gender,
          phone: data.phone,
          avatar: data.avatar,
          companyName: data.companyName,
          companyDirection: data.companyDirection,
          companyPhone: data.companyPhone,
          companyWebsite: data.companyWebsite,
          companyLogo: data.companyLogo,
          devices: data.devices,
          license: data.license
            ? {
                create: {
                  status: data.license.status,
                  expirationDate: data.license.expirationDate,
                  planId: data.license.planId,
                },
              }
            : undefined,
        },
        select: {
          ...userPublicSelect,
          license: true,
        },
      });
    } catch (error) {
      throw new DatabaseError('Failed to upsert WordPress user', error as Error);
    }
  }
}
