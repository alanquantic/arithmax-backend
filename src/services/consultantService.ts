import { Prisma } from '@prisma/client';
import { ConsultantModel } from '../models/consultantModel';
import { ConsultantRepository } from '../repositories/consultantRepository';
import { ConsultantValidator } from '../validators/consultantValidator';

export class ConsultantService {
  private consultantRepository: ConsultantRepository;
  constructor() {
    this.consultantRepository = new ConsultantRepository();
  }

  async findAll(): Promise<ConsultantModel[]> {
    return this.consultantRepository.findAll();
  }

  async create(data: Prisma.ConsultantUncheckedCreateInput): Promise<ConsultantModel> {
    ConsultantValidator.validateCreateData(data as unknown as Prisma.ConsultantCreateInput);

    return this.consultantRepository.create(data);
  }

  async update(
    id: string,
    data: Prisma.ConsultantUpdateInput
  ): Promise<ConsultantModel> {
    ConsultantValidator.validateUpdateData(data as Prisma.ConsultantCreateInput, id);

    return this.consultantRepository.update(id, data);
  }

  async delete(id: string): Promise<ConsultantModel> {
    return this.consultantRepository.delete(id);
  }

  async findById(id: string): Promise<ConsultantModel | null> {
    return this.consultantRepository.findById(id);
  }

  async findByUserId(userId: number): Promise<ConsultantModel[]> {
    return this.consultantRepository.findByUserId(userId);
  }
}
