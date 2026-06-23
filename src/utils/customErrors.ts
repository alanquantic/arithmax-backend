export class ValidationError extends Error {
  public readonly statusCode: number = 400;
  public readonly isOperational: boolean = true;

  constructor(message: string) {
    super(message);
    this.name = 'ValidationError';
  }
}

export class NotFoundError extends Error {
  public readonly statusCode: number = 404;
  public readonly isOperational: boolean = true;

  constructor(message: string) {
    super(message);
    this.name = 'NotFoundError';
  }
}

export class DatabaseError extends Error {
  public readonly statusCode: number = 500;
  public readonly isOperational: boolean = false;

  constructor(
    message: string,
    public readonly originalError?: Error
  ) {
    super(message);
    this.name = 'DatabaseError';
  }
}

export class BusinessLogicError extends Error {
  public readonly statusCode: number = 422;
  public readonly isOperational: boolean = true;

  constructor(message: string) {
    super(message);
    this.name = 'BusinessLogicError';
  }
}
