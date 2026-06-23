import express from 'express';
import { AuthMiddleware } from '../middlewares/authMiddleware';
import { ConsultantGroupDataService } from '../services/consultantGroupDataService';
import { Controller } from './controller';

export class ConsultantGroupDataController extends Controller {
  protected readonly path: string = '/group-data';
  private readonly consultantGroupDataService = new ConsultantGroupDataService();

  protected doInitialize(): void {
    this.post('/:consultantId', AuthMiddleware.authenticate, this.createConsultantGroupData.bind(this));
    this.post('/:groupDataId/member', AuthMiddleware.authenticate, this.createConsultantGroupDataMember.bind(this));
    this.put('/:id', AuthMiddleware.authenticate, this.updateConsultantGroupData.bind(this));
    this.delete('/:id', AuthMiddleware.authenticate, this.deleteConsultantGroupData.bind(this));
    this.get('/:id', AuthMiddleware.authenticate, this.getConsultantGroupData.bind(this));
    this.get('/consultant/:consultantId', AuthMiddleware.authenticate, this.getAllConsultantGroupData.bind(this));
  }

  private async createConsultantGroupData(req: express.Request, res: express.Response) {
    try {
      if (!req.params.consultantId) {
        return res.status(400).json({ message: 'ID del consultor es requerido' });
      }

      const groupDataData = {
        ...req.body,
        id: Math.random().toString(36).substring(2, 9),
        consultantId: req.params.consultantId,
      };

      const consultantGroupData = await this.consultantGroupDataService.create(groupDataData);

      if (!consultantGroupData) {
        return res.status(400).json({ message: 'Error al crear el group data del consultor' });
      }

      res.status(201).json(consultantGroupData);
    } catch (error) {
      res.status(500).json({ message: error as string });
      console.error(error);
    }
  }

  private async createConsultantGroupDataMember(req: express.Request, res: express.Response) {
    try {
      if (!req.params.groupDataId) {
        return res.status(400).json({ message: 'ID del group data es requerido' });
      }

      const memberData = {
        ...req.body,
        id: Math.random().toString(36).substring(2, 9),
      };

      const member = await this.consultantGroupDataService.createMember(
        req.params.groupDataId,
        memberData
      );

      if (!member) {
        return res.status(400).json({ message: 'Error al crear el miembro del group data' });
      }

      res.status(201).json(member);
    } catch (error) {
      res.status(500).json({ message: error as string });
      console.error(error);
    }
  }

  private async updateConsultantGroupData(req: express.Request, res: express.Response) {
    try {
      if (!req.params.id) {
        return res.status(400).json({ message: 'ID del group data es requerido' });
      }

      if (!req.body || Object.keys(req.body).length === 0) {
        return res.status(400).json({ message: 'No se proporcionaron datos para actualizar el group data' });
      }

      const consultantGroupData = await this.consultantGroupDataService.update(
        req.params.id,
        req.body
      );

      res.status(200).json(consultantGroupData);
    } catch (error) {
      res.status(500).json({ message: 'Error al actualizar el group data del consultor' });
    }
  }

  private async deleteConsultantGroupData(req: express.Request, res: express.Response) {
    try {
      if (!req.params.id) {
        return res.status(400).json({ message: 'ID del group data es requerido' });
      }

      const consultantGroupData = await this.consultantGroupDataService.delete(req.params.id);
      res.status(200).json(consultantGroupData);
    } catch (error) {
      res.status(500).json({ message: 'Error al eliminar el group data del consultor' });
    }
  }

  private async getConsultantGroupData(req: express.Request, res: express.Response) {
    try {
      const consultantGroupData = await this.consultantGroupDataService.get(req.params.id);
      res.status(200).json(consultantGroupData);
    } catch (error) {
      res.status(500).json({ message: 'Error al obtener el group data del consultor' });
    }
  }

  private async getAllConsultantGroupData(req: express.Request, res: express.Response) {
    try {
      if (!req.params.consultantId) {
        return res.status(400).json({ message: 'ID del consultor es requerido' });
      }

      const consultantGroupData = await this.consultantGroupDataService.getAll(
        req.params.consultantId
      );

      res.status(200).json(consultantGroupData);
    } catch (error) {
      res.status(500).json({ message: 'Error al obtener todos los group data del consultor' });
    }
  }
}
