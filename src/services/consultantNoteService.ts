import { Prisma } from '@prisma/client';
import { ConsultantNoteModel } from '../models/consultantNoteModel';
import { ConsultantNoteRepository } from '../repositories/consultantNoteRepository';
import { ValidationError } from '../utils/customErrors';

export class ConsultantNoteService {
  private consultantNoteRepository: ConsultantNoteRepository;

  constructor() {
    this.consultantNoteRepository = new ConsultantNoteRepository();
  }

  async create(
    data: Prisma.ConsultantNoteUncheckedCreateInput
  ): Promise<ConsultantNoteModel> {
    this.validateNoteData(data);
    return this.consultantNoteRepository.create(data);
  }

  async upsert(
    data: Prisma.ConsultantNoteUncheckedCreateInput
  ): Promise<ConsultantNoteModel> {
    this.validateNoteData(data);
    return this.consultantNoteRepository.upsert(data);
  }

  async update(
    id: number,
    data: Prisma.ConsultantNoteUpdateInput
  ): Promise<ConsultantNoteModel> {
    if (!id || Number.isNaN(Number(id))) {
      throw new ValidationError('Valid consultant note ID is required');
    }

    return this.consultantNoteRepository.update(id, data);
  }

  async delete(id: number): Promise<ConsultantNoteModel> {
    return this.consultantNoteRepository.delete(id);
  }

  async findById(id: number): Promise<ConsultantNoteModel> {
    return this.consultantNoteRepository.findById(id);
  }

  async findByConsultantId(consultantId: string): Promise<ConsultantNoteModel[]> {
    return this.consultantNoteRepository.findByConsultantId(consultantId);
  }

  private validateNoteData(data: Prisma.ConsultantNoteUncheckedCreateInput): void {
    if (!data.consultantId) {
      throw new ValidationError('Consultant ID is required');
    }

    if (!data.dateKey) {
      throw new ValidationError('Date key is required');
    }

    if (!data.pathKey) {
      throw new ValidationError('Path key is required');
    }
  }
}
