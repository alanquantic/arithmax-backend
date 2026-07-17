import express from 'express';
import { rateLimit } from 'express-rate-limit';
import { AuthMiddleware } from '../middlewares/authMiddleware';
import { AuthService } from '../services/authService';
import { Controller } from './controller';

type AuthenticatedRequest = express.Request & {
  user?: {
    id: number;
    email: string;
  };
};

// Frena fuerza bruta de credenciales sin estorbar el uso normal
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: { message: 'Demasiados intentos, intenta de nuevo mas tarde' },
});

const resetLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: { message: 'Demasiados intentos, intenta de nuevo mas tarde' },
});

export class AuthController extends Controller {
  protected readonly path: string = '/auth';
  private readonly authService = new AuthService();

  protected doInitialize(): void {
    this.post('/login', loginLimiter, this.login.bind(this));
    this.get('/me', AuthMiddleware.authenticate, this.me.bind(this));
    this.post('/forgot-password', resetLimiter, this.forgotPassword.bind(this));
    this.post('/reset-password', resetLimiter, this.resetPassword.bind(this));
    this.put(
      '/change-password',
      AuthMiddleware.authenticate,
      this.changePassword.bind(this)
    );
  }

  private async login(
    req: express.Request,
    res: express.Response,
    next: express.NextFunction
  ) {
    if (!req.body || Object.keys(req.body).length === 0) {
      return res.status(400).json({
        message: 'No se proporcionaron credenciales',
      });
    }

    try {
      const result = await this.authService.login(req.body);
      res.status(200).json(result);
    } catch (error) {
      next(error);
    }
  }

  private async me(req: AuthenticatedRequest, res: express.Response) {
    try {
      if (!req.user) {
        return res.status(401).json({ message: 'Usuario no autenticado' });
      }

      const user = await this.authService.me(req.user.id);
      res.status(200).json(user);
    } catch (error) {
      res.status(500).json({ message: 'Error al obtener el usuario autenticado' });
    }
  }

  private async forgotPassword(
    req: express.Request,
    res: express.Response,
    next: express.NextFunction
  ) {
    try {
      const result = await this.authService.forgotPassword(req.body?.email);
      res.status(200).json(result);
    } catch (error) {
      next(error);
    }
  }

  private async resetPassword(
    req: express.Request,
    res: express.Response,
    next: express.NextFunction
  ) {
    try {
      const result = await this.authService.resetPassword(
        req.body?.token,
        req.body?.password
      );
      res.status(200).json(result);
    } catch (error) {
      next(error);
    }
  }

  private async changePassword(
    req: AuthenticatedRequest,
    res: express.Response,
    next: express.NextFunction
  ) {
    try {
      if (!req.user) {
        return res.status(401).json({ message: 'Usuario no autenticado' });
      }

      const result = await this.authService.changePassword(
        req.user.id,
        req.body?.currentPassword,
        req.body?.newPassword
      );
      res.status(200).json(result);
    } catch (error) {
      next(error);
    }
  }
}
