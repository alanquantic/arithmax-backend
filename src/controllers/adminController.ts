import * as path from 'path';
import express from 'express';
import { Controller } from './controller';
import { AuthMiddleware } from '../middlewares/authMiddleware';
import { AdminMiddleware } from '../middlewares/adminMiddleware';
import { AdminUserService } from '../services/adminUserService';
import { AuthService } from '../services/authService';

const guard = [AuthMiddleware.authenticate, AdminMiddleware.requireAdmin];

export class AdminController extends Controller {
  protected readonly path: string = '/admin';
  private readonly adminUserService = new AdminUserService();
  private readonly authService = new AuthService();

  protected doInitialize(): void {
    // La pagina es publica; los datos no: todo /admin/api/* exige rol admin
    this.get('/', this.servePanel.bind(this));

    this.get('/api/users', ...guard, this.listUsers.bind(this));
    this.get('/api/users/:id', ...guard, this.getUser.bind(this));
    this.post('/api/users', ...guard, this.createUser.bind(this));
    this.put('/api/users/:id', ...guard, this.updateUser.bind(this));
    this.delete('/api/users/:id', ...guard, this.deleteUser.bind(this));
    this.post('/api/users/:id/send-reset', ...guard, this.sendReset.bind(this));
    this.get('/api/purchase-events', ...guard, this.listPurchaseEvents.bind(this));
  }

  private servePanel(req: express.Request, res: express.Response) {
    res.sendFile(path.resolve(process.cwd(), 'public', 'admin', 'index.html'));
  }

  private async listUsers(
    req: express.Request,
    res: express.Response,
    next: express.NextFunction
  ) {
    try {
      const search = String(req.query.search ?? '').trim();
      const page = Math.max(1, Number(req.query.page ?? 1) || 1);
      const pageSize = Math.min(100, Math.max(1, Number(req.query.pageSize ?? 25) || 25));
      res.status(200).json(await this.adminUserService.listUsers(search, page, pageSize));
    } catch (error) {
      next(error);
    }
  }

  private async getUser(
    req: express.Request,
    res: express.Response,
    next: express.NextFunction
  ) {
    try {
      res.status(200).json(await this.adminUserService.getUser(Number(req.params.id)));
    } catch (error) {
      next(error);
    }
  }

  private async createUser(
    req: express.Request,
    res: express.Response,
    next: express.NextFunction
  ) {
    try {
      res.status(201).json(await this.adminUserService.createUser(req.body ?? {}));
    } catch (error) {
      next(error);
    }
  }

  private async updateUser(
    req: express.Request,
    res: express.Response,
    next: express.NextFunction
  ) {
    try {
      res
        .status(200)
        .json(await this.adminUserService.updateUser(Number(req.params.id), req.body ?? {}));
    } catch (error) {
      next(error);
    }
  }

  private async deleteUser(
    req: express.Request,
    res: express.Response,
    next: express.NextFunction
  ) {
    try {
      res.status(200).json(await this.adminUserService.deleteUser(Number(req.params.id)));
    } catch (error) {
      next(error);
    }
  }

  private async sendReset(
    req: express.Request,
    res: express.Response,
    next: express.NextFunction
  ) {
    try {
      const user = await this.adminUserService.getUser(Number(req.params.id));
      res.status(200).json(await this.authService.forgotPassword(user.email));
    } catch (error) {
      next(error);
    }
  }

  private async listPurchaseEvents(
    req: express.Request,
    res: express.Response,
    next: express.NextFunction
  ) {
    try {
      const limit = Math.min(200, Math.max(1, Number(req.query.limit ?? 50) || 50));
      res.status(200).json(await this.adminUserService.listPurchaseEvents(limit));
    } catch (error) {
      next(error);
    }
  }
}
