import { ValidationError } from '../utils/customErrors';

export abstract class BaseValidator {
  protected static validateRequired(value: unknown, fieldName: string): void {
    if (value === null || value === undefined || value === '') {
      throw new ValidationError(`${fieldName} is required`);
    }
  }

  protected static validateString(
    value: string,
    fieldName: string,
    minLength: number = 1,
    maxLength?: number
  ): void {
    if (typeof value !== 'string') {
      throw new ValidationError(`${fieldName} must be a string`);
    }

    if (value.trim().length < minLength) {
      throw new ValidationError(
        `${fieldName} must be at least ${minLength} characters long`
      );
    }

    if (maxLength && value.trim().length > maxLength) {
      throw new ValidationError(
        `${fieldName} cannot exceed ${maxLength} characters`
      );
    }
  }

  protected static validateNumber(
    value: number,
    fieldName: string,
    min?: number,
    max?: number
  ): void {
    if (typeof value !== 'number' || isNaN(value)) {
      throw new ValidationError(`${fieldName} must be a valid number`);
    }

    if (min !== undefined && value < min) {
      throw new ValidationError(`${fieldName} must be at least ${min}`);
    }

    if (max !== undefined && value > max) {
      throw new ValidationError(`${fieldName} must be at most ${max}`);
    }
  }

  protected static validateEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  protected static validatePhone(phone: string): boolean {
    const cleanPhone = phone.replace(/[\s\-()]/g, '');
    const phoneRegex = /^[+]?[1-9][\d]{7,15}$/;
    return (
      cleanPhone.length >= 7 &&
      cleanPhone.length <= 15 &&
      phoneRegex.test(cleanPhone)
    );
  }

  protected static validateDate(
    date: string | Date,
    fieldName: string,
    allowFuture: boolean = false
  ): void {
    const dateObj = new Date(date);

    if (isNaN(dateObj.getTime())) {
      throw new ValidationError(`Invalid ${fieldName} format`);
    }

    if (!allowFuture && dateObj > new Date()) {
      throw new ValidationError(`${fieldName} cannot be in the future`);
    }

    // Verificar que no sea una fecha muy antigua
    const minDate = new Date('1900-01-01');
    if (dateObj < minDate) {
      throw new ValidationError(`${fieldName} cannot be before 1900`);
    }
  }

  protected static validateUrl(url: string): boolean {
    try {
      new URL(url);
      return true;
    } catch {
      return false;
    }
  }

  protected static validateName(name: string): boolean {
    const nameRegex = /^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s\-']+$/;
    return nameRegex.test(name.trim()) && name.trim().length >= 2;
  }

  protected static validateId(id: string | number, fieldName: string): void {
    if (!id) {
      throw new ValidationError(`${fieldName} is required`);
    }

    if (typeof id === 'string' && id.trim().length < 3) {
      throw new ValidationError(
        `${fieldName} must be at least 3 characters long`
      );
    }

    if (typeof id === 'number' && id <= 0) {
      throw new ValidationError(`${fieldName} must be a positive number`);
    }
  }
}
