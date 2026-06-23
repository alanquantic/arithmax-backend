import { Prisma } from '@prisma/client';
import {
  ConsultantPartnerDataModel,
  ConsultantPartnerDataPartnerModel,
} from '../models/consultantPartnerDataModel';
import { ConsultantPartnerDataRepository } from '../repositories/consultantPartnerDataRepository';
import { ConsultantPartnerDataValidator } from '../validators/consultantPartnerDataValidator';

export class ConsultantPartnerDataService {
  private consultantPartnerDataRepository: ConsultantPartnerDataRepository;

  constructor() {
    this.consultantPartnerDataRepository = new ConsultantPartnerDataRepository();
  }

  async create(data: Prisma.ConsultantPartnerDataCreateInput): Promise<ConsultantPartnerDataModel> {
    ConsultantPartnerDataValidator.validateCreateData(data);
    return this.consultantPartnerDataRepository.create(data);
  }

  async createPartner(
    id: string,
    data: Prisma.ConsultantPartnerDataPartnerCreateInput
  ): Promise<ConsultantPartnerDataPartnerModel> {
    ConsultantPartnerDataValidator.validatePartnerCreateData(data);
    return this.consultantPartnerDataRepository.createPartner(id, data);
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

  async get(id: string): Promise<ConsultantPartnerDataModel> {
    return this.consultantPartnerDataRepository.get(id);
  }

  async getAll(consultantId: string): Promise<ConsultantPartnerDataModel[]> {
    return this.consultantPartnerDataRepository.getAll(consultantId);
  }
}
