import { Prisma } from '@prisma/client';
import { ValidationError } from '../utils/customErrors';

export class ConsultantGroupDataValidator {
  static validateCreateData(data: Prisma.ConsultantGroupDataCreateInput): void {
    if (!data.name) {
      throw new ValidationError('Group name is required');
    }

    if (!data.date) {
      throw new ValidationError('Group date is required');
    }
  }

  static validateMemberCreateData(
    data: Prisma.ConsultantGroupDataMemberCreateInput
  ): void {
    if (!data.name) {
      throw new ValidationError('Member name is required');
    }

    if (!data.lastName) {
      throw new ValidationError('Member last name is required');
    }

    if (!data.scdLastName) {
      throw new ValidationError('Member second last name is required');
    }

    if (!data.date) {
      throw new ValidationError('Member date is required');
    }
  }

  static validateUpdateData(
    data: Prisma.ConsultantGroupDataUpdateInput,
    id: string
  ): void {
    if (!id) {
      throw new ValidationError('ID is required');
    }

    this.validateCreateData(data as Prisma.ConsultantGroupDataCreateInput);
  }
}
