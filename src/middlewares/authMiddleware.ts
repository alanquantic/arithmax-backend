import express from 'express';
import { ValidationError } from '../utils/customErrors';

const jwt: {
  verify: (token: string, secret: string) => unknown;
} = require('jsonwebtoken');

type AuthTokenPayload = {
  userId: number;
  email: string;
};

type AuthenticatedRequest = express.Request & {
  user?: {
    id: number;
    email: string;
  };
};

export class AuthMiddleware {
  static authenticate(
    req: AuthenticatedRequest,
    res: express.Response,
    next: express.NextFunction
  ) {
    try {
      const authHeader = req.headers.authorization;

      if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({
          message: 'Token de autenticacion requerido',
        });
      }

      const token = authHeader.slice(7);
      const secret = process.env.JWT_SECRET;

      if (!secret) {
        throw new ValidationError('JWT_SECRET is not configured');
      }

      const payload = jwt.verify(token, secret) as AuthTokenPayload;

      req.user = {
        id: payload.userId,
        email: payload.email,
      };

      next();
    } catch (error) {
      return res.status(401).json({
        message: 'Token invalido o expirado',
      });
    }
  }
}
