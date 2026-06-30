import { Prisma } from '@prisma/client';
import { GuestEnergyModel } from '../models/guestEnergyModel';
import { GuestGroupMemberModel } from '../models/guestGroupModel';
import { GuestModel } from '../models/guestModel';
import { GuestPartnerModel } from '../models/guestPartnerModel';
import { GuestEnergyRepository } from '../repositories/guestEnergyRepository';
import { ValidationError } from '../utils/customErrors';

export class GuestEnergyService {
  private guestEnergyRepository: GuestEnergyRepository;

  constructor() {
    this.guestEnergyRepository = new GuestEnergyRepository();
  }

  async getByUserId(userId: number): Promise<GuestEnergyModel> {
    return this.guestEnergyRepository.getByUserId(userId);
  }

  async upsertGuest(
    userId: number,
    data: Prisma.GuestUncheckedCreateInput
  ): Promise<GuestModel> {
    if (!userId || Number.isNaN(Number(userId))) {
      throw new ValidationError('Valid user ID is required');
    }

    return this.guestEnergyRepository.upsertGuest(userId, data);
  }

  async createPartner(
    data: Prisma.GuestPartnerUncheckedCreateInput
  ): Promise<GuestPartnerModel> {
    this.validateGuestPartnerData(data);
    return this.guestEnergyRepository.createPartner(data);
  }

  async updatePartner(
    id: string,
    data: Prisma.GuestPartnerUpdateInput
  ): Promise<GuestPartnerModel> {
    if (!id) {
      throw new ValidationError('Guest partner ID is required');
    }

    return this.guestEnergyRepository.updatePartner(id, data);
  }

  async deletePartner(id: string): Promise<GuestPartnerModel> {
    return this.guestEnergyRepository.deletePartner(id);
  }

  async createGroupMember(
    data: Prisma.GuestGroupMemberUncheckedCreateInput
  ): Promise<GuestGroupMemberModel> {
    this.validateGuestGroupMemberData(data);
    return this.guestEnergyRepository.createGroupMember(data);
  }

  async updateGroupMember(
    id: string,
    data: Prisma.GuestGroupMemberUpdateInput
  ): Promise<GuestGroupMemberModel> {
    if (!id) {
      throw new ValidationError('Guest group member ID is required');
    }

    return this.guestEnergyRepository.updateGroupMember(id, data);
  }

  async deleteGroupMember(id: string): Promise<GuestGroupMemberModel> {
    return this.guestEnergyRepository.deleteGroupMember(id);
  }

  async replacePartners(
    guestId: number,
    partners: Array<{
      names?: string | null;
      lastName?: string | null;
      scdLastName?: string | null;
      date?: Date;
    }>
  ): Promise<GuestPartnerModel[]> {
    return this.guestEnergyRepository.replacePartners(guestId, partners);
  }

  async replaceGroupMembers(
    guestId: number,
    members: Array<{
      name?: string | null;
      lastName?: string | null;
      scdLastName?: string | null;
      date?: Date;
      dateInit?: number | null;
    }>
  ): Promise<GuestGroupMemberModel[]> {
    return this.guestEnergyRepository.replaceGroupMembers(guestId, members);
  }

  private validateGuestPartnerData(
    data: Prisma.GuestPartnerUncheckedCreateInput
  ): void {
    if (!data.guestId || Number.isNaN(Number(data.guestId))) {
      throw new ValidationError('Valid guest ID is required');
    }
  }

  private validateGuestGroupMemberData(
    data: Prisma.GuestGroupMemberUncheckedCreateInput
  ): void {
    if (!data.guestId || Number.isNaN(Number(data.guestId))) {
      throw new ValidationError('Valid guest ID is required');
    }
  }
}
