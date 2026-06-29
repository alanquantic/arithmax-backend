import { Prisma } from '@prisma/client';
import {
  ConsultantPartnerDataModel,
  ConsultantPartnerDataModelWithRelations,
  ConsultantPartnerDataPartnerModel,
} from '../models/consultantPartnerDataModel';
import { ConsultantPartnerDataRepository } from '../repositories/consultantPartnerDataRepository';
import { ConsultantPartnerDataValidator } from '../validators/consultantPartnerDataValidator';

export class ConsultantPartnerDataService {
  private consultantPartnerDataRepository: ConsultantPartnerDataRepository;

  constructor() {
    this.consultantPartnerDataRepository = new ConsultantPartnerDataRepository();
  }

  async create(data: Prisma.ConsultantPartnerDataUncheckedCreateInput): Promise<ConsultantPartnerDataModel> {
    ConsultantPartnerDataValidator.validateCreateData(data as unknown as Prisma.ConsultantPartnerDataCreateInput);
    return this.consultantPartnerDataRepository.create(data);
  }

  async createPartner(
    id: string,
    data: Prisma.ConsultantPartnerDataPartnerCreateInput
  ): Promise<ConsultantPartnerDataPartnerModel> {
    ConsultantPartnerDataValidator.validatePartnerCreateData(data);
    return this.consultantPartnerDataRepository.createPartner(id, data);
  }
  async updatePartner(
    id: string,
    data: Prisma.ConsultantPartnerDataPartnerUpdateInput
  ): Promise<ConsultantPartnerDataPartnerModel> {
    ConsultantPartnerDataValidator.validatePartnerCreateData(
      data as Prisma.ConsultantPartnerDataPartnerCreateInput
    );
    return this.consultantPartnerDataRepository.updatePartner(id, data);
  }
  async deletePartner(id: string): Promise<ConsultantPartnerDataPartnerModel> {
    return this.consultantPartnerDataRepository.deletePartner(id);
  }

  async update(
    id: string,
    data: Prisma.ConsultantPartnerDataUpdateInput
  ): Promise<ConsultantPartnerDataModel> {
    ConsultantPartnerDataValidator.validateUpdateData(data, id);
    return this.consultantPartnerDataRepository.update(id, data);
  }

  async delete(id: string): Promise<ConsultantPartnerDataModel> {
    return this.consultantPartnerDataRepository.delete(id);
  }

  async get(id: string): Promise<ConsultantPartnerDataModelWithRelations> {
    return this.consultantPartnerDataRepository.get(id);
  }

  async getAll(consultantId: string): Promise<ConsultantPartnerDataModelWithRelations[]> {
    return this.consultantPartnerDataRepository.getAll(consultantId);
  }
}
