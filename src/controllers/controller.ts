import express from 'express';

import { ErrorMiddleware } from '../middlewares/errorMiddlewares';

export abstract class Controller {
  protected abstract readonly path: string;

  private readonly router: express.Router;

  constructor(protected readonly app: express.Express) {
    this.router = express.Router();
  }

  initialize() {
    this.app.use(this.path, this.router);
    this.doInitialize();
    this.router.use(ErrorMiddleware.handle);
  }

  protected abstract doInitialize(): void;

  protected get(path: string, ...handles: express.RequestHandler[]) {
    this.router.get(path, Controller.getHandlers(handles));
  }

  protected post(path: string, ...handles: express.RequestHandler[]) {
    this.router.post(path, Controller.getHandlers(handles));
  }

  protected put(path: string, ...handles: express.RequestHandler[]) {
    this.router.put(path, Controller.getHandlers(handles));
  }

  protected delete(path: string, ...handles: express.RequestHandler[]) {
    this.router.delete(path, Controller.getHandlers(handles));
  }

  private static getHandlers(requestHandlers: express.RequestHandler[]) {
    const handlers: express.RequestHandler[] = [];

    requestHandlers.forEach(requestHandler => {
      handlers.push((req, res, next) =>
        Controller.withErrorHandler(requestHandler, req, res, next)
      );
    });

    return handlers;
  }

  private static async withErrorHandler(
    handle: express.RequestHandler,
    req: express.Request,
    res: express.Response,
    next: express.NextFunction
  ) {
    try {
      await handle(req, res, next);
    } catch (e) {
      next(e);
    }
  }
}
