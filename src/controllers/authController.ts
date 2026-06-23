import express from 'express';
import { AuthMiddleware } from '../middlewares/authMiddleware';
import { AuthService } from '../services/authService';
import { Controller } from './controller';

export class AuthController extends Controller {
  protected readonly path: string = '/auth';
  private readonly authService = new AuthService();

  protected doInitialize(): void {
    this.post('/login', this.login.bind(this));
    this.get('/me', AuthMiddleware.authenticate, this.me.bind(this));
  }

  private async login(req: express.Request, res: express.Response) {
    try {
      if (!req.body || Object.keys(req.body).length === 0) {
        return res.status(400).json({
          message: 'No se proporcionaron credenciales',
        });
      }

      const result = await this.authService.login(req.body);
      res.status(200).json(result);
    } catch (error) {
      res.status(500).json({ message: 'Error al iniciar sesion' });
    }
  }

  private async me(req: express.Request, res: express.Response) {
    try {
      const user = await this.authService.me(req.user!.id);
      res.status(200).json(user);
    } catch (error) {
      res.status(500).json({ message: 'Error al obtener el usuario autenticado' });
    }
  }
}
