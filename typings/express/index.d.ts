import 'express';

declare global {
  namespace Express {
    interface UserContext {
      id: number;
      email: string;
    }

    interface Request {
      user?: UserContext;
    }
  }
}

export {};
