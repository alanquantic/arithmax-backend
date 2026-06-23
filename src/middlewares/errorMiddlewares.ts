import express, { NextFunction } from 'express';
import createHttpError, { HttpError, isHttpError } from 'http-errors';
import { errors } from '../utils/errors';
import {
  ValidationError,
  NotFoundError,
  DatabaseError,
  BusinessLogicError,
} from '../utils/customErrors';

export class ErrorMiddleware {
  static handle(
    e: unknown,
    req: express.Request,
    res: express.Response,
    next: NextFunction
  ) {
    // Si ya se envió la respuesta, no hacer nada
    if (res.headersSent) {
      return;
    }

    // Manejar errores personalizados
    if (e instanceof ValidationError) {
      return res.status(e.statusCode).json({
        error: {
          type: 'ValidationError',
          message: e.message,
          statusCode: e.statusCode,
        },
      });
    }

    if (e instanceof NotFoundError) {
      return res.status(e.statusCode).json({
        error: {
          type: 'NotFoundError',
          message: e.message,
          statusCode: e.statusCode,
        },
      });
    }

    if (e instanceof BusinessLogicError) {
      return res.status(e.statusCode).json({
        error: {
          type: 'BusinessLogicError',
          message: e.message,
          statusCode: e.statusCode,
        },
      });
    }

    if (e instanceof DatabaseError) {
      return res.status(e.statusCode).json({
        error: {
          type: 'DatabaseError',
          message: 'Database operation failed',
          statusCode: e.statusCode,
        },
      });
    }

    // Manejar errores HTTP estándar
    const httpError = isHttpError(e)
      ? (e as HttpError)
      : new createHttpError.InternalServerError();

    if (httpError.expose) {
      next(httpError);
    } else {
      const cause = (e as Error)?.cause as Record<string, unknown>;
      if (cause?.code) {
        res
          .status(400)
          .json({ error: { code: cause.code, message: 'An error occurred.' } });
        return;
      }

      const errorToShow =
        errors.find(error => error.code === httpError.message) ?? false;
      res.status(httpError.status).json({
        error: errorToShow
          ? errorToShow.message
          : 'Something went wrong. Please try again later.',
      });
    }
  }
}
