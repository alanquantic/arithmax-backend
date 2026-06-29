import express from 'express';
import { AuthMiddleware } from '../middlewares/authMiddleware';
import { AuthService } from '../services/authService';
import { Controller } from './controller';

type AuthenticatedRequest = express.Request & {
  user?: {
    id: number;
    email: string;
  };
};

export class AuthController extends Controller {
  protected readonly path: string = '/auth';
  private readonly authService = new AuthService();

  protected doInitialize(): void {
    this.post('/login', this.login.bind(this));
    this.get('/me', AuthMiddleware.authenticate, this.me.bind(this));
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
}
