import { ValidationError } from '../utils/customErrors';

export class AuthValidator {
  static validateLoginData(data: Record<string, unknown>): void {
    if (!data.username || typeof data.username !== 'string') {
      throw new ValidationError('Username is required');
    }

    if (!data.password || typeof data.password !== 'string') {
      throw new ValidationError('Password is required');
    }
  }
}
