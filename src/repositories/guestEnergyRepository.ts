import { Prisma, PrismaClient } from '@prisma/client';
import { GuestEnergyModel } from '../models/guestEnergyModel';
import { GuestGroupMemberModel } from '../models/guestGroupModel';
import { GuestModel } from '../models/guestModel';
import { GuestPartnerModel } from '../models/guestPartnerModel';
import {
  DatabaseError,
  NotFoundError,
  ValidationError,
} from '../utils/customErrors';

const prisma = new PrismaClient();

export class GuestEnergyRepository {
  async getByUserId(userId: number): Promise<GuestEnergyModel> {
    if (!userId || Number.isNaN(Number(userId))) {
      throw new ValidationError('Valid user ID is required');
    }

    try {
      const guest = await prisma.guest.findUnique({
        where: { userId: Number(userId) },
        include: {
          guestPartners: true,
          guestGroupMembers: true,
        },
      });

      if (!guest) {
        throw new NotFoundError('Guest energy not found');
      }

      return {
        guest: {
          id: guest.id,
          userId: guest.userId,
          partnerName: guest.partnerName,
          partnerMeetYear: guest.partnerMeetYear,
          groupName: guest.groupName,
          groupYear: guest.groupYear,
        },
        guestPartners: guest.guestPartners,
        guestGroupMembers: guest.guestGroupMembers,
      };
    } catch (error) {
      if (error instanceof NotFoundError) {
        throw error;
      }

      throw new DatabaseError('Failed to get guest energy', error as Error);
    }
  }

  async upsertGuest(
    userId: number,
    data: Prisma.GuestUncheckedCreateInput
  ): Promise<GuestModel> {
    if (!userId || Number.isNaN(Number(userId))) {
      throw new ValidationError('Valid user ID is required');
    }

    if (!data) {
      throw new ValidationError('Guest data is required');
    }

    try {
      return await prisma.guest.upsert({
        where: { userId: Number(userId) },
        update: {
          partnerName: data.partnerName,
          partnerMeetYear: data.partnerMeetYear,
          groupName: data.groupName,
          groupYear: data.groupYear,
        },
        create: {
          userId: Number(userId),
          partnerName: data.partnerName,
          partnerMeetYear: data.partnerMeetYear,
          groupName: data.groupName,
          groupYear: data.groupYear,
        },
      });
    } catch (error) {
      throw new DatabaseError('Failed to upsert guest energy', error as Error);
    }
  }

  async createPartner(
    data: Prisma.GuestPartnerUncheckedCreateInput
  ): Promise<GuestPartnerModel> {
    if (!data) {
      throw new ValidationError('Guest partner data is required');
    }

    try {
      return await prisma.guestPartner.create({
        data,
      });
    } catch (error) {
      throw new DatabaseError('Failed to create guest partner', error as Error);
    }
  }

  async updatePartner(
    id: string,
    data: Prisma.GuestPartnerUpdateInput
  ): Promise<GuestPartnerModel> {
    if (!id) {
      throw new ValidationError('Guest partner ID is required');
    }

    try {
      return await prisma.guestPartner.update({
        where: { id },
        data,
      });
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === 'P2025'
      ) {
        throw new NotFoundError('Guest partner not found');
      }

      throw new DatabaseError('Failed to update guest partner', error as Error);
    }
  }

  async deletePartner(id: string): Promise<GuestPartnerModel> {
    if (!id) {
      throw new ValidationError('Guest partner ID is required');
    }

    try {
      return await prisma.guestPartner.delete({
        where: { id },
      });
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === 'P2025'
      ) {
        throw new NotFoundError('Guest partner not found');
      }

      throw new DatabaseError('Failed to delete guest partner', error as Error);
    }
  }

  async createGroupMember(
    data: Prisma.GuestGroupMemberUncheckedCreateInput
  ): Promise<GuestGroupMemberModel> {
    if (!data) {
      throw new ValidationError('Guest group member data is required');
    }

    try {
      return await prisma.guestGroupMember.create({
        data,
      });
    } catch (error) {
      throw new DatabaseError(
        'Failed to create guest group member',
        error as Error
      );
    }
  }

  async updateGroupMember(
    id: string,
    data: Prisma.GuestGroupMemberUpdateInput
  ): Promise<GuestGroupMemberModel> {
    if (!id) {
      throw new ValidationError('Guest group member ID is required');
    }

    try {
      return await prisma.guestGroupMember.update({
        where: { id },
        data,
      });
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === 'P2025'
      ) {
        throw new NotFoundError('Guest group member not found');
      }

      throw new DatabaseError(
        'Failed to update guest group member',
        error as Error
      );
    }
  }

  async deleteGroupMember(id: string): Promise<GuestGroupMemberModel> {
    if (!id) {
      throw new ValidationError('Guest group member ID is required');
    }

    try {
      return await prisma.guestGroupMember.delete({
        where: { id },
      });
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === 'P2025'
      ) {
        throw new NotFoundError('Guest group member not found');
      }

      throw new DatabaseError(
        'Failed to delete guest group member',
        error as Error
      );
    }
  }
}
