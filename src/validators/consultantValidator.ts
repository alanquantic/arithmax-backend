import { Prisma } from '@prisma/client';
import { ValidationError } from '../utils/customErrors';

export class ConsultantValidator {
  static validateCreateData(data: Prisma.ConsultantCreateInput): void {
    // Validaciones de campos importantes
    if(!data.names) {
      throw new ValidationError('Names are required');
    }
    if(!data.lastName) {
      throw new ValidationError('Last name is required');
    }
    if(!data.scdLastName) {
      throw new ValidationError('Second last name is required');
    }
    if(!data.date) {
      throw new ValidationError('Date is required');
    }

  }

  static validateUpdateData(data: Prisma.ConsultantCreateInput, id: string): void {
    // Para updates, solo validar campos importantes que se están actualizando
    if(!id) {
      throw new ValidationError('ID is required');
    }
    ConsultantValidator.validateCreateData(data);
  }
}