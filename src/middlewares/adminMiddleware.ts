import express from 'express';
import { prisma } from '../lib/prisma';

type AuthenticatedRequest = express.Request & {
  user?: {
    id: number;
    email: string;
  };
};

export class AdminMiddleware {
  // Se encadena despues de AuthMiddleware.authenticate; consulta el rol en BD
  // (no en el token) para que revocar admin surta efecto inmediato
  static async requireAdmin(
    req: AuthenticatedRequest,
    res: express.Response,
    next: express.NextFunction
  ) {
    try {
      if (!req.user) {
        return res.status(401).json({ message: 'Usuario no autenticado' });
      }

      const user = await prisma.user.findUnique({
        where: { id: req.user.id },
        select: { role: true },
      });

      if (user?.role !== 'admin') {
        return res.status(403).json({ message: 'Se requiere rol de administrador' });
      }

      next();
    } catch (error) {
      next(error);
    }
  }
}
