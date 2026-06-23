import { Prisma } from '@prisma/client';
import { ValidationError } from '../utils/customErrors';

export class UserValidator {
  static validateCreateData(data: Prisma.UserCreateInput): void {
    if(!data.firstName) {
      throw new ValidationError('First name is required');
    }
    if(!data.lastName) {
      throw new ValidationError('Last name is required');
    }
    if(!data.scdLastName) {
      throw new ValidationError('Second last name is required');
    }
    if(!data.birthDate) {
      throw new ValidationError('Birth date is required');
    }
  }

  static validateUpdateData(data: Prisma.UserUpdateInput, id: number): void {
    if(!id) {
      throw new ValidationError('ID is required');
    }
    UserValidator.validateCreateData(data as Prisma.UserCreateInput);

  }

}
