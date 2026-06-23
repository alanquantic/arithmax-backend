import {
  ConsultantGroupDataMemberModel,
  ConsultantGroupDataModel,
} from '../models/consultantGroupDataModel';
import { DatabaseError, NotFoundError, ValidationError } from '../utils/customErrors';
import { Prisma, PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export class ConsultantGroupDataRepository {
  async create(data: Prisma.ConsultantGroupDataCreateInput): Promise<ConsultantGroupDataModel> {
    if (!data) {
      throw new ValidationError('Group data is required');
    }

    try {
      return await prisma.consultantGroupData.create({
        data,
      });
    } catch (error) {
      throw new DatabaseError('Failed to create GroupData', error as Error);
    }
  }

  async createMember(
    id: string,
    data: Prisma.ConsultantGroupDataMemberCreateInput
  ): Promise<ConsultantGroupDataMemberModel> {
    if (!data) {
      throw new ValidationError('Group member data is required');
    }

    if (!id) {
      throw new ValidationError('GroupData ID is required');
    }

    try {
      return await prisma.consultantGroupDataMember.create({
        data: {
          ...data,
          groupData: {
            connect: { id },
          },
        },
      });
    } catch (error) {
      throw new DatabaseError('Failed to create GroupData member', error as Error);
    }
  }

  async update(
    id: string,
    data: Prisma.ConsultantGroupDataUpdateInput
  ): Promise<ConsultantGroupDataModel> {
    if (!id) {
      throw new ValidationError('GroupData ID is required');
    }

    if (!data) {
      throw new ValidationError('GroupData data is required');
    }

    try {
      return await prisma.consultantGroupData.update({
        where: { id },
        data,
      });
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === 'P2025'
      ) {
        throw new NotFoundError('GroupData not found');
      }

      throw new DatabaseError('Failed to update GroupData', error as Error);
    }
  }

  async delete(id: string): Promise<ConsultantGroupDataModel> {
    if (!id) {
      throw new ValidationError('GroupData ID is required');
    }

    try {
      return await prisma.consultantGroupData.delete({
        where: { id },
      });
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === 'P2025'
      ) {
        throw new NotFoundError('GroupData not found');
      }

      throw new DatabaseError('Failed to delete GroupData', error as Error);
    }
  }

  async get(id: string): Promise<ConsultantGroupDataModel> {
    if (!id) {
      throw new ValidationError('GroupData ID is required');
    }

    try {
      const groupData = await prisma.consultantGroupData.findUnique({
        where: { id },
      });

      if (!groupData) {
        throw new NotFoundError('GroupData not found');
      }

      return groupData;
    } catch (error) {
      if (error instanceof NotFoundError) {
        throw error;
      }

      throw new DatabaseError('Failed to get GroupData', error as Error);
    }
  }

  async getAll(consultantId: string): Promise<ConsultantGroupDataModel[]> {
    if (!consultantId) {
      throw new ValidationError('Consultant ID is required');
    }

    try {
      return await prisma.consultantGroupData.findMany({
        where: { consultantId },
      });
    } catch (error) {
      throw new DatabaseError('Failed to get all GroupData', error as Error);
    }
  }
}
