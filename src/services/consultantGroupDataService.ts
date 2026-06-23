import { Prisma } from '@prisma/client';
import {
  ConsultantGroupDataMemberModel,
  ConsultantGroupDataModel,
} from '../models/consultantGroupDataModel';
import { ConsultantGroupDataRepository } from '../repositories/consultantGroupDataRepository';
import { ConsultantGroupDataValidator } from '../validators/consultantGroupDataValidator';

export class ConsultantGroupDataService {
  private consultantGroupDataRepository: ConsultantGroupDataRepository;

  constructor() {
    this.consultantGroupDataRepository = new ConsultantGroupDataRepository();
  }

  async create(data: Prisma.ConsultantGroupDataCreateInput): Promise<ConsultantGroupDataModel> {
    ConsultantGroupDataValidator.validateCreateData(data);
    return this.consultantGroupDataRepository.create(data);
  }

  async createMember(
    id: string,
    data: Prisma.ConsultantGroupDataMemberCreateInput
  ): Promise<ConsultantGroupDataMemberModel> {
    ConsultantGroupDataValidator.validateMemberCreateData(data);
    return this.consultantGroupDataRepository.createMember(id, data);
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

  async get(id: string): Promise<ConsultantGroupDataModel> {
    return this.consultantGroupDataRepository.get(id);
  }

  async getAll(consultantId: string): Promise<ConsultantGroupDataModel[]> {
    return this.consultantGroupDataRepository.getAll(consultantId);
  }
}
