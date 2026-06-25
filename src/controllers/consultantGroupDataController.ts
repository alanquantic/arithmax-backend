import express from 'express';
import { AuthMiddleware } from '../middlewares/authMiddleware';
import { ConsultantGroupDataService } from '../services/consultantGroupDataService';
import { Controller } from './controller';

const getParam = (value: string | string[] | undefined) =>
  Array.isArray(value) ? value[0] : value;

const normalizeOptionalDate = (value: unknown) => {
  if (!value) {
    return undefined;
  }

  const normalizedDate = new Date(String(value));

  if (Number.isNaN(normalizedDate.getTime())) {
    return undefined;
  }

  return normalizedDate;
};

export class ConsultantGroupDataController extends Controller {
  protected readonly path: string = '/group-data';
  private readonly consultantGroupDataService = new ConsultantGroupDataService();

  protected doInitialize(): void {
    this.post('/:consultantId', AuthMiddleware.authenticate, this.createConsultantGroupData.bind(this));
    this.get('/consultant/:consultantId', AuthMiddleware.authenticate, this.getAllConsultantGroupData.bind(this));
    this.post('/:groupDataId/member', AuthMiddleware.authenticate, this.createConsultantGroupDataMember.bind(this));
    this.put('/member/:memberId', AuthMiddleware.authenticate, this.updateConsultantGroupDataMember.bind(this));
    this.delete('/member/:memberId', AuthMiddleware.authenticate, this.deleteConsultantGroupDataMember.bind(this));
    this.put('/:id', AuthMiddleware.authenticate, this.updateConsultantGroupData.bind(this));
    this.delete('/:id', AuthMiddleware.authenticate, this.deleteConsultantGroupData.bind(this));
    this.get('/:id', AuthMiddleware.authenticate, this.getConsultantGroupData.bind(this));
  }

  private async createConsultantGroupData(req: express.Request, res: express.Response) {
    try {
      if (!req.params.consultantId) {
        return res.status(400).json({ message: 'ID del consultor es requerido' });
      }

      const groupDataData = {
        ...req.body,
        id: Math.random().toString(36).substring(2, 9),
        consultantId: getParam(req.params.consultantId) || '',
        date: normalizeOptionalDate(req.body.date),
      };

      const consultantGroupData = await this.consultantGroupDataService.create(groupDataData);

      if (!consultantGroupData) {
        return res.status(400).json({ message: 'Error al crear el group data del consultor' });
      }

      res.status(201).json(consultantGroupData);
    } catch (error) {
      res.status(500).json({
        message: error instanceof Error ? error.message : 'Error al crear el group data del consultor',
      });
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
        date: normalizeOptionalDate(req.body.date),
      };

      const member = await this.consultantGroupDataService.createMember(
        getParam(req.params.groupDataId) || '',
        memberData
      );

      if (!member) {
        return res.status(400).json({ message: 'Error al crear el miembro del group data' });
      }

      res.status(201).json(member);
    } catch (error) {
      res.status(500).json({
        message: error instanceof Error ? error.message : 'Error al crear el miembro del group data',
      });
    }
  }
  private async updateConsultantGroupDataMember(req: express.Request, res: express.Response) {
    try {
      if (!req.params.memberId) {
        return res.status(400).json({ message: 'ID del miembro es requerido' });
      }
      if (!req.body || Object.keys(req.body).length === 0) {
        return res.status(400).json({ message: 'No se proporcionaron datos para actualizar el miembro' });
      }
      const member = await this.consultantGroupDataService.updateMember(
        getParam(req.params.memberId) || '',
        {
          ...req.body,
          date: normalizeOptionalDate(req.body.date),
        }
      );
      res.status(200).json(member);
    } catch (error) {
      res.status(500).json({ message: 'Error al actualizar el miembro del group data' });
    }
  }
  private async deleteConsultantGroupDataMember(req: express.Request, res: express.Response) {
    try {
      if (!req.params.memberId) {
        return res.status(400).json({ message: 'ID del miembro es requerido' });
      }
      const member = await this.consultantGroupDataService.deleteMember(getParam(req.params.memberId) || '');
      res.status(200).json(member);
    } catch (error) {
      res.status(500).json({ message: 'Error al eliminar el miembro del group data' });
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
        getParam(req.params.id) || '',
        {
          ...req.body,
          date: normalizeOptionalDate(req.body.date),
        }
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

      const consultantGroupData = await this.consultantGroupDataService.delete(getParam(req.params.id) || '');
      res.status(200).json(consultantGroupData);
    } catch (error) {
      res.status(500).json({ message: 'Error al eliminar el group data del consultor' });
    }
  }

  private async getConsultantGroupData(req: express.Request, res: express.Response) {
    try {
      const consultantGroupData = await this.consultantGroupDataService.get(getParam(req.params.id) || '');
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
        getParam(req.params.consultantId) || ''
      );

      res.status(200).json(consultantGroupData);
    } catch (error) {
      res.status(500).json({ message: 'Error al obtener todos los group data del consultor' });
    }
  }
}
