import express from 'express';
import { AuthMiddleware } from '../middlewares/authMiddleware';
import { ConsultantPartnerDataService } from '../services/consultantPartnerDataService';
import { parseDateOnlyInput } from '../utils/date';
import { Controller } from './controller';

const getParam = (value: string | string[] | undefined) =>
  Array.isArray(value) ? value[0] : value;

export class ConsultantPartnerDataController extends Controller {
  protected readonly path: string = '/partner-data';
  private readonly consultantPartnerDataService = new ConsultantPartnerDataService();

  protected doInitialize(): void {
    this.post('/:consultantId', AuthMiddleware.authenticate, this.createConsultantPartnerData.bind(this));
    this.get('/consultant/:consultantId', AuthMiddleware.authenticate, this.getAllConsultantPartnerData.bind(this));
    this.post('/:partnerDataId/partner', AuthMiddleware.authenticate, this.createConsultantPartner.bind(this));
    this.put('/partner/:partnerId', AuthMiddleware.authenticate, this.updateConsultantPartner.bind(this));
    this.delete('/partner/:partnerId', AuthMiddleware.authenticate, this.deleteConsultantPartner.bind(this));
    this.put('/:id', AuthMiddleware.authenticate, this.updateConsultantPartnerData.bind(this));
    this.delete('/:id', AuthMiddleware.authenticate, this.deleteConsultantPartnerData.bind(this));
    this.get('/:id', AuthMiddleware.authenticate, this.getConsultantPartnerData.bind(this));
  }

  private async createConsultantPartnerData(req: express.Request, res: express.Response) {
    try {
      if (!req.params.consultantId) {
        return res.status(400).json({ message: 'ID del consultor es requerido' });
      }

      const partnerDataData = {
        ...req.body,
        id: Math.random().toString(36).substring(2, 9),
        consultantId: getParam(req.params.consultantId) || '',
        date: parseDateOnlyInput(req.body.date),
      };

      const consultantPartnerData = await this.consultantPartnerDataService.create(partnerDataData);

      if (!consultantPartnerData) {
        return res.status(400).json({ message: 'Error al crear el partner data del consultor' });
      }

      res.status(201).json(consultantPartnerData);
    } catch (error) {
      res.status(500).json({
        message: error instanceof Error ? error.message : 'Error al crear el partner data del consultor',
      });
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
        scdLastName: req.body.scdLastName ? String(req.body.scdLastName).trim() : null,
        date: parseDateOnlyInput(req.body.date),
      };

      const partner = await this.consultantPartnerDataService.createPartner(
        getParam(req.params.partnerDataId) || '',
        partnerData
      );

      if (!partner) {
        return res.status(400).json({ message: 'Error al crear el partner del partner data' });
      }

      res.status(201).json(partner);
    } catch (error) {
      res.status(500).json({
        message: error instanceof Error ? error.message : 'Error al crear el partner del partner data',
      });
    }
  }
  private async updateConsultantPartner(req: express.Request, res: express.Response) {
    try {
      if (!req.params.partnerId) {
        return res.status(400).json({ message: 'ID del partner es requerido' });
      }
      if (!req.body || Object.keys(req.body).length === 0) {
        return res.status(400).json({ message: 'No se proporcionaron datos para actualizar el partner' });
      }
      const partner = await this.consultantPartnerDataService.updatePartner(
        getParam(req.params.partnerId) || '',
        {
          ...req.body,
          scdLastName: req.body.scdLastName ? String(req.body.scdLastName).trim() : null,
          date: parseDateOnlyInput(req.body.date),
        }
      );
      res.status(200).json(partner);
    } catch (error) {
      res.status(500).json({ message: 'Error al actualizar el partner del consultor' });
    }
  }
  private async deleteConsultantPartner(req: express.Request, res: express.Response) {
    try {
      if (!req.params.partnerId) {
        return res.status(400).json({ message: 'ID del partner es requerido' });
      }
      const partner = await this.consultantPartnerDataService.deletePartner(getParam(req.params.partnerId) || '');
      res.status(200).json(partner);
    } catch (error) {
      res.status(500).json({ message: 'Error al eliminar el partner del consultor' });
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
        getParam(req.params.id) || '',
        {
          ...req.body,
          date: parseDateOnlyInput(req.body.date),
        }
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

      const consultantPartnerData = await this.consultantPartnerDataService.delete(getParam(req.params.id) || '');
      res.status(200).json(consultantPartnerData);
    } catch (error) {
      res.status(500).json({ message: 'Error al eliminar el partner data del consultor' });
    }
  }

  private async getConsultantPartnerData(req: express.Request, res: express.Response) {
    try {
      const consultantPartnerData = await this.consultantPartnerDataService.get(getParam(req.params.id) || '');
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
        getParam(req.params.consultantId) || ''
      );

      res.status(200).json(consultantPartnerData);
    } catch (error) {
      res.status(500).json({ message: 'Error al obtener todos los partner data del consultor' });
    }
  }
}
