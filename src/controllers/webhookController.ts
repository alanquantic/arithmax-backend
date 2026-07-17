import * as crypto from 'crypto';
import express from 'express';
import { Controller } from './controller';
import {
  PurchaseWebhookService,
  StoreWebhookPayload,
} from '../services/purchaseWebhookService';
import { ValidationError } from '../utils/customErrors';

type RequestWithRawBody = express.Request & { rawBody?: Buffer };

const headerValue = (req: express.Request, name: string): string | undefined => {
  const value = req.headers[name];
  const first = Array.isArray(value) ? value[0] : value;
  const trimmed = first?.trim();
  return trimmed || undefined;
};

export class WebhookController extends Controller {
  protected readonly path: string = '/webhooks';
  private readonly purchaseWebhookService = new PurchaseWebhookService();

  protected doInitialize(): void {
    this.post('/store/purchase', this.handleStorePurchase.bind(this));
  }

  private async handleStorePurchase(
    req: express.Request,
    res: express.Response,
    next: express.NextFunction
  ) {
    try {
      if (!this.hasValidSignature(req as RequestWithRawBody)) {
        return res.status(401).json({ message: 'Firma invalida' });
      }

      // event/kind/deliveryId pueden venir en el body o en los headers
      // X-Nume-Event / X-Nume-Kind / X-Nume-Delivery; el body tiene prioridad
      const body = (req.body ?? {}) as StoreWebhookPayload;
      const result = await this.purchaseWebhookService.process({
        ...body,
        event: body.event ?? headerValue(req, 'x-nume-event'),
        kind: body.kind ?? headerValue(req, 'x-nume-kind'),
        deliveryId: body.deliveryId ?? headerValue(req, 'x-nume-delivery'),
      });

      res.status(200).json(result);
    } catch (error) {
      if (error instanceof ValidationError) {
        return res.status(400).json({ message: error.message });
      }
      // 500: la tienda reintentara; el intento fallido queda en purchase_events
      next(error);
    }
  }

  // HMAC-SHA256 del body crudo con el secreto compartido, comparado en tiempo
  // constante contra el header X-Signature
  private hasValidSignature(req: RequestWithRawBody): boolean {
    const secret = process.env.STORE_WEBHOOK_SECRET;
    if (!secret) {
      // Sin secreto configurado no se aceptan webhooks: fallar cerrado
      return false;
    }

    const signature = String(req.headers['x-signature'] ?? '').trim().toLowerCase();
    if (!signature || !req.rawBody) {
      return false;
    }

    const expected = crypto
      .createHmac('sha256', secret)
      .update(req.rawBody)
      .digest('hex');

    const sigBuf = Buffer.from(signature, 'utf8');
    const expBuf = Buffer.from(expected, 'utf8');
    return sigBuf.length === expBuf.length && crypto.timingSafeEqual(sigBuf, expBuf);
  }
}
