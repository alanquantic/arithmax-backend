import express from 'express';
import { AuthMiddleware } from '../middlewares/authMiddleware';
import { ConsultantPartnerDataService } from '../services/consultantPartnerDataService';
import { Controller } from './controller';

export class ConsultantPartnerDataController extends Controller {
  protected readonly path: string = '/partner-data';
  private readonly consultantPartnerDataService = new ConsultantPartnerDataService();

  protected doInitialize(): void {
    this.post('/:consultantId', AuthMiddleware.authenticate, this.createConsultantPartnerData.bind(this));
    this.post('/:partnerDataId/partner', AuthMiddleware.authenticate, this.createConsultantPartner.bind(this));
    this.put('/:id', AuthMiddleware.authenticate, this.updateConsultantPartnerData.bind(this));
    this.delete('/:id', AuthMiddleware.authenticate, this.deleteConsultantPartnerData.bind(this));
    this.get('/:id', AuthMiddleware.authenticate, this.getConsultantPartnerData.bind(this));
    this.get('/consultant/:consultantId', AuthMiddleware.authenticate, this.getAllConsultantPartnerData.bind(this));
  }

  private async createConsultantPartnerData(req: express.Request, res: express.Response) {
    try {
      if (!req.params.consultantId) {
        return res.status(400).json({ message: 'ID del consultor es requerido' });
      }

      const partnerDataData = {
        ...req.body,
        id: Math.random().toString(36).substring(2, 9),
        consultantId: req.params.consultantId,
      };

      const consultantPartnerData = await this.consultantPartnerDataService.create(partnerDataData);

      if (!consultantPartnerData) {
        return res.status(400).json({ message: 'Error al crear el partner data del consultor' });
      }

      res.status(201).json(consultantPartnerData);
    } catch (error) {
      res.status(500).json({ message: error as string });
      console.error(error);
    }
  }

  private async createConsultantPartner(req: express.Request, res: express.Response) {
    try {
      if (!req.params.partnerDataId) {
        return res.status(400).json({ message: 'ID del partner data es requerido' });
      }

      const partnerData = {
        ...req.body,
        id: Math.random().toString(36).substring(2, 9),
      };

      const partner = await this.consultantPartnerDataService.createPartner(
        req.params.partnerDataId,
        partnerData
      );

      if (!partner) {
        return res.status(400).json({ message: 'Error al crear el partner del partner data' });
      }

      res.status(201).json(partner);
    } catch (error) {
      res.status(500).json({ message: error as string });
      console.error(error);
    }
  }

  private async updateConsultantPartnerData(req: express.Request, res: express.Response) {
    try {
      if (!req.params.id) {
        return res.status(400).json({ message: 'ID del partner data es requerido' });
      }

      if (!req.body || Object.keys(req.body).length === 0) {
        return res.status(400).json({ message: 'No se proporcionaron datos para actualizar el partner data' });
      }

      const consultantPartnerData = await this.consultantPartnerDataService.update(
        req.params.id,
        req.body
      );

      res.status(200).json(consultantPartnerData);
    } catch (error) {
      res.status(500).json({ message: 'Error al actualizar el partner data del consultor' });
    }
  }

  private async deleteConsultantPartnerData(req: express.Request, res: express.Response) {
    try {
      if (!req.params.id) {
        return res.status(400).json({ message: 'ID del partner data es requerido' });
      }

      const consultantPartnerData = await this.consultantPartnerDataService.delete(req.params.id);
      res.status(200).json(consultantPartnerData);
    } catch (error) {
      res.status(500).json({ message: 'Error al eliminar el partner data del consultor' });
    }
  }

  private async getConsultantPartnerData(req: express.Request, res: express.Response) {
    try {
      const consultantPartnerData = await this.consultantPartnerDataService.get(req.params.id);
      res.status(200).json(consultantPartnerData);
    } catch (error) {
      res.status(500).json({ message: 'Error al obtener el partner data del consultor' });
    }
  }

  private async getAllConsultantPartnerData(req: express.Request, res: express.Response) {
    try {
      if (!req.params.consultantId) {
        return res.status(400).json({ message: 'ID del consultor es requerido' });
      }

      const consultantPartnerData = await this.consultantPartnerDataService.getAll(
        req.params.consultantId
      );

      res.status(200).json(consultantPartnerData);
    } catch (error) {
      res.status(500).json({ message: 'Error al obtener todos los partner data del consultor' });
    }
  }
}
