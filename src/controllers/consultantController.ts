import { ConsultantService } from '../services/consultantService';
import { ConsultantNoteService } from '../services/consultantNoteService';
import express from 'express';
import { Controller } from './controller';
import { AuthMiddleware } from '../middlewares/authMiddleware';
import { parseDateOnlyInput } from '../utils/date';

const getParam = (value: string | string[] | undefined) =>
  Array.isArray(value) ? value[0] : value;

export class ConsultantController extends Controller {
  protected readonly path: string = '/consultants';
  private readonly consultantService = new ConsultantService();
  private readonly consultantNoteService = new ConsultantNoteService();

  protected doInitialize(): void {
    this.get('/', AuthMiddleware.authenticate, this.getAllConsultants.bind(this));
    this.get('/user/:userId', AuthMiddleware.authenticate, this.getConsultantsByUserId.bind(this));
    this.get('/:consultantId/notes', AuthMiddleware.authenticate, this.getConsultantNotes.bind(this));
    this.get('/:consultantId/notes/:noteId', AuthMiddleware.authenticate, this.getConsultantNoteById.bind(this));
    this.get('/:id', AuthMiddleware.authenticate, this.getConsultantById.bind(this));
    this.post('/:consultantId/notes', AuthMiddleware.authenticate, this.upsertConsultantNote.bind(this));
    this.put('/:consultantId/notes/:noteId', AuthMiddleware.authenticate, this.updateConsultantNote.bind(this));
    this.delete('/:consultantId/notes/:noteId', AuthMiddleware.authenticate, this.deleteConsultantNote.bind(this));
    this.post('/', AuthMiddleware.authenticate, this.createConsultant.bind(this));
    this.put('/:id', AuthMiddleware.authenticate, this.updateConsultant.bind(this));
    this.delete('/:id', AuthMiddleware.authenticate, this.deleteConsultant.bind(this));
  }

  private async getAllConsultants(req: express.Request, res: express.Response) {
    try {
      const consultants = await this.consultantService.findAll();
      res.status(200).json(consultants);
    } catch (error) {
      res.status(500).json({ message: 'Error al obtener los consultores' });
    }
  }
  private async getConsultantById(req: express.Request, res: express.Response) {
    try {
      const consultant = await this.consultantService.findById(getParam(req.params.id) || '');
      res.status(200).json(consultant);
    } catch (error) {
      res.status(500).json({ message: 'Error al obtener el consultor' });
    }
  }
  private async getConsultantsByUserId(
    req: express.Request,
    res: express.Response
  ) {
    try {
      const consultants = await this.consultantService.findByUserId(
        parseInt(getParam(req.params.userId) || '0')
      );
      res.status(200).json(consultants);
    } catch (error) {
      res.status(500).json({ message: 'Error al obtener los consultores' });
    }
  }
  private async createConsultant(req: express.Request, res: express.Response) {
    try {
      if (!req.body || Object.keys(req.body).length === 0) {
        return res
          .status(400)
          .json({
            message: 'No se proporcionaron datos para crear el consultor',
          });
      }

      // Generar ID único si no se proporciona
      const consultantData = {
        ...req.body,
        id:
          req.body.id ||
          `consultant_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        scdLastName: req.body.scdLastName ? String(req.body.scdLastName).trim() : null,
        date: parseDateOnlyInput(req.body.date),
      };
      const consultant = await this.consultantService.create(consultantData);
      res.status(201).json(consultant);
    } catch (error) {
      res.status(500).json({ message: 'Error al crear el consultor' });
    }
  }
  private async updateConsultant(
    req: express.Request,
    res: express.Response,
    next: express.NextFunction
  ) {
    if (!req.params.id) {
      return res
        .status(400)
        .json({ message: 'ID del consultor es requerido' });
    }

    if (!req.body || Object.keys(req.body).length === 0) {
      return res
        .status(400)
        .json({ message: 'No se proporcionaron datos para actualizar' });
    }

    try {
      const updateData = {
        ...req.body,
        scdLastName: req.body.scdLastName ? String(req.body.scdLastName).trim() : null,
        date: parseDateOnlyInput(req.body.date),
      };

      const consultant = await this.consultantService.update(
        getParam(req.params.id) || '',
        updateData
      );
      res.status(200).json(consultant);
    } catch (error) {
      next(error);
    }
  }
  private async deleteConsultant(req: express.Request, res: express.Response) {
    try {
      const consultant = await this.consultantService.delete(getParam(req.params.id) || '');
      res.status(200).json(consultant);
    } catch (error) {
      res.status(500).json({ message: 'Error al eliminar el consultor' });
    }
  }

  private async getConsultantNotes(req: express.Request, res: express.Response) {
    try {
      if (!req.params.consultantId) {
        return res
          .status(400)
          .json({ message: 'ID del consultor es requerido' });
      }

      const notes = await this.consultantNoteService.findByConsultantId(
        getParam(req.params.consultantId) || ''
      );
      res.status(200).json(notes);
    } catch (error) {
      res.status(500).json({ message: 'Error al obtener las notas del consultor' });
    }
  }

  private async getConsultantNoteById(req: express.Request, res: express.Response) {
    try {
      if (!req.params.noteId) {
        return res.status(400).json({ message: 'ID de la nota es requerido' });
      }

      const note = await this.consultantNoteService.findById(Number(req.params.noteId));
      res.status(200).json(note);
    } catch (error) {
      res.status(500).json({ message: 'Error al obtener la nota del consultor' });
    }
  }

  private async upsertConsultantNote(req: express.Request, res: express.Response) {
    try {
      if (!req.params.consultantId) {
        return res
          .status(400)
          .json({ message: 'ID del consultor es requerido' });
      }

      if (!req.body || Object.keys(req.body).length === 0) {
        return res
          .status(400)
          .json({ message: 'No se proporcionaron datos para la nota del consultor' });
      }

      const noteData = {
        ...req.body,
        consultantId: getParam(req.params.consultantId) || '',
      };

      const note = await this.consultantNoteService.upsert(noteData);
      res.status(200).json(note);
    } catch (error) {
      res.status(500).json({ message: 'Error al guardar la nota del consultor' });
    }
  }

  private async updateConsultantNote(req: express.Request, res: express.Response) {
    try {
      if (!req.params.noteId) {
        return res.status(400).json({ message: 'ID de la nota es requerido' });
      }

      if (!req.body || Object.keys(req.body).length === 0) {
        return res
          .status(400)
          .json({ message: 'No se proporcionaron datos para actualizar la nota' });
      }

      const note = await this.consultantNoteService.update(
        Number(req.params.noteId),
        req.body
      );

      res.status(200).json(note);
    } catch (error) {
      res.status(500).json({ message: 'Error al actualizar la nota del consultor' });
    }
  }

  private async deleteConsultantNote(req: express.Request, res: express.Response) {
    try {
      if (!req.params.noteId) {
        return res.status(400).json({ message: 'ID de la nota es requerido' });
      }

      const note = await this.consultantNoteService.delete(Number(req.params.noteId));
      res.status(200).json(note);
    } catch (error) {
      res.status(500).json({ message: 'Error al eliminar la nota del consultor' });
    }
  }
}
