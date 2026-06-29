import { Prisma } from '@prisma/client';
import {
  ConsultantGroupDataMemberModel,
  ConsultantGroupDataModel,
  ConsultantGroupDataModelWithRelations,
} from '../models/consultantGroupDataModel';
import { ConsultantGroupDataRepository } from '../repositories/consultantGroupDataRepository';
import { ConsultantGroupDataValidator } from '../validators/consultantGroupDataValidator';

export class ConsultantGroupDataService {
  private consultantGroupDataRepository: ConsultantGroupDataRepository;

  constructor() {
    this.consultantGroupDataRepository = new ConsultantGroupDataRepository();
  }

  async create(data: Prisma.ConsultantGroupDataUncheckedCreateInput): Promise<ConsultantGroupDataModel> {
    ConsultantGroupDataValidator.validateCreateData(data as unknown as Prisma.ConsultantGroupDataCreateInput);
    return this.consultantGroupDataRepository.create(data);
  }

  async createMember(
    id: string,
    data: Prisma.ConsultantGroupDataMemberCreateInput
  ): Promise<ConsultantGroupDataMemberModel> {
    ConsultantGroupDataValidator.validateMemberCreateData(data);
    return this.consultantGroupDataRepository.createMember(id, data);
  }
  async updateMember(
    id: string,
    data: Prisma.ConsultantGroupDataMemberUpdateInput
  ): Promise<ConsultantGroupDataMemberModel> {
    ConsultantGroupDataValidator.validateMemberCreateData(
      data as Prisma.ConsultantGroupDataMemberCreateInput
    );
    return this.consultantGroupDataRepository.updateMember(id, data);
  }
  async deleteMember(id: string): Promise<ConsultantGroupDataMemberModel> {
    return this.consultantGroupDataRepository.deleteMember(id);
  }

  async update(
    id: string,
    data: Prisma.ConsultantGroupDataUpdateInput
  ): Promise<ConsultantGroupDataModel> {
    ConsultantGroupDataValidator.validateUpdateData(data, id);
    return this.consultantGroupDataRepository.update(id, data);
  }

  async delete(id: string): Promise<ConsultantGroupDataModel> {
    return this.consultantGroupDataRepository.delete(id);
  }

  async get(id: string): Promise<ConsultantGroupDataModelWithRelations> {
    return this.consultantGroupDataRepository.get(id);
  }

  async getAll(consultantId: string): Promise<ConsultantGroupDataModelWithRelations[]> {
    return this.consultantGroupDataRepository.getAll(consultantId);
  }
}
