import { Prisma } from '@prisma/client';
import { ValidationError } from '../utils/customErrors';

export class ConsultantPartnerDataValidator {
  static validateCreateData(data: Prisma.ConsultantPartnerDataCreateInput): void {
    if (!data.name) {
      throw new ValidationError('Partner data name is required');
    }

    if (!data.date) {
      throw new ValidationError('Partner data date is required');
    }
  }

  static validatePartnerCreateData(
    data: Prisma.ConsultantPartnerDataPartnerCreateInput
  ): void {
    if (!data.names) {
      throw new ValidationError('Partner names are required');
    }

    if (!data.lastName) {
      throw new ValidationError('Partner last name is required');
    }

    if (!data.scdLastName) {
      throw new ValidationError('Partner second last name is required');
    }

    if (!data.date) {
      throw new ValidationError('Partner date is required');
    }
  }

  static validateUpdateData(
    data: Prisma.ConsultantPartnerDataUpdateInput,
    id: string
  ): void {
    if (!id) {
      throw new ValidationError('ID is required');
    }

    this.validateCreateData(data as Prisma.ConsultantPartnerDataCreateInput);
  }
}
