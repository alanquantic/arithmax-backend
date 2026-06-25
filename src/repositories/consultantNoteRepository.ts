import { Prisma } from '@prisma/client';
import { prisma } from '../lib/prisma';
import { ConsultantNoteModel } from '../models/consultantNoteModel';
import {
  DatabaseError,
  NotFoundError,
  ValidationError,
} from '../utils/customErrors';

export class ConsultantNoteRepository {
  async create(
    data: Prisma.ConsultantNoteUncheckedCreateInput
  ): Promise<ConsultantNoteModel> {
    if (!data) {
      throw new ValidationError('Consultant note data is required');
    }

    try {
      return await prisma.consultantNote.create({
        data,
      });
    } catch (error) {
      throw new DatabaseError('Failed to create consultant note', error as Error);
    }
  }

  async upsert(
    data: Prisma.ConsultantNoteUncheckedCreateInput
  ): Promise<ConsultantNoteModel> {
    if (!data?.consultantId) {
      throw new ValidationError('Consultant ID is required');
    }

    if (!data.dateKey) {
      throw new ValidationError('Date key is required');
    }

    if (!data.pathKey) {
      throw new ValidationError('Path key is required');
    }

    try {
      return await prisma.consultantNote.upsert({
        where: {
          consultantId_dateKey_pathKey: {
            consultantId: data.consultantId,
            dateKey: data.dateKey,
            pathKey: data.pathKey,
          },
        },
        update: {
          value: data.value,
        },
        create: data,
      });
    } catch (error) {
      throw new DatabaseError('Failed to upsert consultant note', error as Error);
    }
  }

  async update(
    id: number,
    data: Prisma.ConsultantNoteUpdateInput
  ): Promise<ConsultantNoteModel> {
    if (!id || Number.isNaN(Number(id))) {
      throw new ValidationError('Valid consultant note ID is required');
    }

    try {
      return await prisma.consultantNote.update({
        where: { id: Number(id) },
        data,
      });
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === 'P2025'
      ) {
        throw new NotFoundError('Consultant note not found');
      }

      throw new DatabaseError('Failed to update consultant note', error as Error);
    }
  }

  async delete(id: number): Promise<ConsultantNoteModel> {
    if (!id || Number.isNaN(Number(id))) {
      throw new ValidationError('Valid consultant note ID is required');
    }

    try {
      return await prisma.consultantNote.delete({
        where: { id: Number(id) },
      });
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === 'P2025'
      ) {
        throw new NotFoundError('Consultant note not found');
      }

      throw new DatabaseError('Failed to delete consultant note', error as Error);
    }
  }

  async findById(id: number): Promise<ConsultantNoteModel> {
    if (!id || Number.isNaN(Number(id))) {
      throw new ValidationError('Valid consultant note ID is required');
    }

    try {
      const note = await prisma.consultantNote.findUnique({
        where: { id: Number(id) },
      });

      if (!note) {
        throw new NotFoundError('Consultant note not found');
      }

      return note;
    } catch (error) {
      if (error instanceof NotFoundError) {
        throw error;
      }

      throw new DatabaseError('Failed to find consultant note', error as Error);
    }
  }

  async findByConsultantId(consultantId: string): Promise<ConsultantNoteModel[]> {
    if (!consultantId) {
      throw new ValidationError('Consultant ID is required');
    }

    try {
      return await prisma.consultantNote.findMany({
        where: { consultantId },
        orderBy: [{ dateKey: 'desc' }, { pathKey: 'asc' }],
      });
    } catch (error) {
      throw new DatabaseError(
        'Failed to retrieve consultant notes',
        error as Error
      );
    }
  }
}
