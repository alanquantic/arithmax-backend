import { Prisma } from '@prisma/client';
import { prisma } from '../lib/prisma';
import { ConsultantModel } from '../models/consultantModel';
import {
  ValidationError,
  NotFoundError,
  DatabaseError,
} from '../utils/customErrors';

export class ConsultantRepository {
  async create(data: Prisma.ConsultantUncheckedCreateInput) {
    if (!data) {
      throw new ValidationError('Consultant data is required');
    }

    try {
      return await prisma.consultant.create({
        data: data,
      });
    } catch (error) {
      throw new DatabaseError('Failed to create consultant', error as Error);
    }
  }

  async update(
    id: string,
    data: Prisma.ConsultantUpdateInput
  ): Promise<ConsultantModel> {
    if (!id) {
      throw new ValidationError('Consultant ID is required');
    }

    try {
      return await prisma.consultant.update({
        where: { id },
        data: data,
      });
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === 'P2025'
      ) {
        throw new NotFoundError('Consultant not found');
      }
      throw new DatabaseError('Failed to update consultant', error as Error);
    }
  }

  async delete(id: string): Promise<ConsultantModel> {
    if (!id) {
      throw new ValidationError('Consultant ID is required');
    }

    try {
      return await prisma.consultant.delete({
        where: { id },
      });
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === 'P2025'
      ) {
        throw new NotFoundError('Consultant not found');
      }
      throw new DatabaseError('Failed to delete consultant', error as Error);
    }
  }

  async findAll(): Promise<ConsultantModel[]> {
    try {
      return await prisma.consultant.findMany({
        include: {
          user: true,
        },
        orderBy: {
          date: 'desc',
        },
      });
    } catch (error) {
      throw new DatabaseError('Failed to retrieve consultants', error as Error);
    }
  }
  async findByUserId(userId: number) {
    if (!userId || isNaN(Number(userId))) {
      throw new ValidationError('Valid user ID is required');
    }
    try {
      return await prisma.consultant.findMany({
        where: { userId: Number(userId) },
        include: {
          notes: true,
          partners: true,
          createNames: true,
          partnerData: {
            include: {
              partners: true,
            },
          },
          groupData: {
            include: {
              members: true,
            },
          },
        },
        orderBy: {
          names: 'asc',
        },
      });
    } catch (error) {
      throw new DatabaseError(
        'Failed to retrieve consultants by user ID',
        error as Error
      );
    }
  }

  async findById(id: string): Promise<ConsultantModel | null> {
    if (!id) {
      throw new ValidationError('Consultant ID is required');
    }

    try {
      const consultant = await prisma.consultant.findUnique({
        where: { id },
        include: {
          user: true,
          notes: true,
          partners: true,
          createNames: true,
          partnerData: {
            include: {
              partners: true,
            },
          },
          groupData: {
            include: {
              members: true,
            },
          },
        },
      });

      if (!consultant) {
        throw new NotFoundError('Consultant not found');
      }

      return consultant;
    } catch (error) {
      if (error instanceof NotFoundError) {
        throw error;
      }
      throw new DatabaseError('Failed to find consultant', error as Error);
    }
  }
}
