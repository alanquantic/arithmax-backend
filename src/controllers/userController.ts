import { Controller } from './controller';
import { GuestEnergyService } from '../services/guestEnergyService';
import { UserService } from '../services/userService';
import express from 'express';
import { AuthMiddleware } from '../middlewares/authMiddleware';
import { NotFoundError, ValidationError } from '../utils/customErrors';

const getParam = (value: string | string[] | undefined) =>
  Array.isArray(value) ? value[0] : value;

export class UserController extends Controller {
  protected readonly path: string = '/users';
  private readonly userService = new UserService();
  private readonly guestEnergyService = new GuestEnergyService();

  protected doInitialize(): void {
    this.get('/', AuthMiddleware.authenticate, this.getAllUsers.bind(this));
    this.get('/:userId/guest-energy', AuthMiddleware.authenticate, this.getGuestEnergy.bind(this));
    this.post('/:userId/guest-energy', AuthMiddleware.authenticate, this.upsertGuestEnergy.bind(this));
    this.post('/:userId/guest-energy/partners', AuthMiddleware.authenticate, this.createGuestEnergyPartner.bind(this));
    this.put('/:userId/guest-energy/partners/:partnerId', AuthMiddleware.authenticate, this.updateGuestEnergyPartner.bind(this));
    this.delete('/:userId/guest-energy/partners/:partnerId', AuthMiddleware.authenticate, this.deleteGuestEnergyPartner.bind(this));
    this.post('/:userId/guest-energy/group-members', AuthMiddleware.authenticate, this.createGuestEnergyGroupMember.bind(this));
    this.put('/:userId/guest-energy/group-members/:memberId', AuthMiddleware.authenticate, this.updateGuestEnergyGroupMember.bind(this));
    this.delete('/:userId/guest-energy/group-members/:memberId', AuthMiddleware.authenticate, this.deleteGuestEnergyGroupMember.bind(this));
    this.get('/:id', AuthMiddleware.authenticate, this.getUserById.bind(this));
    this.post('/', AuthMiddleware.authenticate, this.createUser.bind(this));
    this.put('/:id', AuthMiddleware.authenticate, this.updateUser.bind(this));
  }

  private async getAllUsers(req: express.Request, res: express.Response) {
    try {
      const users = await this.userService.findAll();
      res.status(200).json(users);
    } catch (error) {
      res.status(500).json({ message: 'Error al obtener los usuarios' });
    }
  }

  private async getUserById(req: express.Request, res: express.Response) {
    try {
      const user = await this.userService.findById(Number(req.params.id));
      res.status(200).json(user);
    } catch (error) {
      res.status(500).json({ message: 'Error al obtener el usuario' });
    }
  }
  private async createUser(req: express.Request, res: express.Response) {
    try {
      if (!req.body || Object.keys(req.body).length === 0) {
        return res
          .status(400)
          .json({
            message: 'No se proporcionaron datos para crear el usuario',
          });
      }

      // Preparar datos de creación con conversión de fecha
      const userData = {
        ...req.body,
        // Convertir fecha a formato ISO si se proporciona
        birthDate: req.body.birthDate
          ? new Date(req.body.birthDate).toISOString()
          : undefined,
      };

      const user = await this.userService.create(userData);
      res.status(201).json(user);
    } catch (error) {
      res.status(500).json({ message: 'Error al crear el usuario' });
    }
  }
  private async updateUser(req: express.Request, res: express.Response) {
    try {
      if (!req.params.id) {
        return res.status(400).json({ message: 'ID del usuario es requerido' });
      }

      if (!req.body || Object.keys(req.body).length === 0) {
        return res
          .status(400)
          .json({ message: 'No se proporcionaron datos para actualizar' });
      }

      // Preparar datos de actualización con conversión de fecha
      const updateData = {
        ...req.body,
        // Convertir fecha a formato ISO si se proporciona
        birthDate: req.body.birthDate
          ? new Date(req.body.birthDate).toISOString()
          : undefined,
      };

      const user = await this.userService.update(
        Number(req.params.id),
        updateData
      );
      res.status(200).json(user);
    } catch (error) {
      res.status(500).json({ message: 'Error al actualizar el usuario' });
    }
  }

  private async getGuestEnergy(req: express.Request, res: express.Response) {
    try {
      if (!req.params.userId) {
        return res.status(400).json({ message: 'ID del usuario es requerido' });
      }

      const guestEnergy = await this.guestEnergyService.getByUserId(
        Number(req.params.userId)
      );

      res.status(200).json(guestEnergy);
    } catch (error) {
      if (error instanceof ValidationError) {
        return res.status(400).json({ message: error.message });
      }

      if (error instanceof NotFoundError) {
        return res.status(404).json({ message: error.message });
      }

      res.status(500).json({ message: 'Error al obtener el guest energy del usuario' });
    }
  }

  private async upsertGuestEnergy(req: express.Request, res: express.Response) {
    try {
      if (!req.params.userId) {
        return res.status(400).json({ message: 'ID del usuario es requerido' });
      }

      if (!req.body || Object.keys(req.body).length === 0) {
        return res
          .status(400)
          .json({ message: 'No se proporcionaron datos para guest energy' });
      }

      const guest = await this.guestEnergyService.upsertGuest(
        Number(req.params.userId),
        req.body
      );

      res.status(200).json(guest);
    } catch (error) {
      res.status(500).json({ message: 'Error al guardar guest energy del usuario' });
    }
  }

  private async createGuestEnergyPartner(req: express.Request, res: express.Response) {
    try {
      if (!req.params.userId) {
        return res.status(400).json({ message: 'ID del usuario es requerido' });
      }

      if (!req.body || Object.keys(req.body).length === 0) {
        return res
          .status(400)
          .json({ message: 'No se proporcionaron datos para el partner guest' });
      }

      const guestEnergy = await this.guestEnergyService.getByUserId(
        Number(req.params.userId)
      );

      const partner = await this.guestEnergyService.createPartner({
        ...req.body,
        id: req.body.id || Math.random().toString(36).substring(2, 9),
        guestId: guestEnergy.guest.id,
      });

      res.status(201).json(partner);
    } catch (error) {
      res.status(500).json({ message: 'Error al crear el partner guest del usuario' });
    }
  }

  private async updateGuestEnergyPartner(req: express.Request, res: express.Response) {
    try {
      if (!req.params.partnerId) {
        return res.status(400).json({ message: 'ID del partner es requerido' });
      }

      if (!req.body || Object.keys(req.body).length === 0) {
        return res
          .status(400)
          .json({ message: 'No se proporcionaron datos para actualizar el partner guest' });
      }

      const partner = await this.guestEnergyService.updatePartner(
        getParam(req.params.partnerId) || '',
        req.body
      );

      res.status(200).json(partner);
    } catch (error) {
      res.status(500).json({ message: 'Error al actualizar el partner guest del usuario' });
    }
  }

  private async deleteGuestEnergyPartner(req: express.Request, res: express.Response) {
    try {
      if (!req.params.partnerId) {
        return res.status(400).json({ message: 'ID del partner es requerido' });
      }

      const partner = await this.guestEnergyService.deletePartner(getParam(req.params.partnerId) || '');
      res.status(200).json(partner);
    } catch (error) {
      res.status(500).json({ message: 'Error al eliminar el partner guest del usuario' });
    }
  }

  private async createGuestEnergyGroupMember(req: express.Request, res: express.Response) {
    try {
      if (!req.params.userId) {
        return res.status(400).json({ message: 'ID del usuario es requerido' });
      }

      if (!req.body || Object.keys(req.body).length === 0) {
        return res
          .status(400)
          .json({ message: 'No se proporcionaron datos para el miembro guest' });
      }

      const guestEnergy = await this.guestEnergyService.getByUserId(
        Number(req.params.userId)
      );

      const member = await this.guestEnergyService.createGroupMember({
        ...req.body,
        id: req.body.id || Math.random().toString(36).substring(2, 9),
        guestId: guestEnergy.guest.id,
      });

      res.status(201).json(member);
    } catch (error) {
      res.status(500).json({ message: 'Error al crear el miembro guest del usuario' });
    }
  }

  private async updateGuestEnergyGroupMember(req: express.Request, res: express.Response) {
    try {
      if (!req.params.memberId) {
        return res.status(400).json({ message: 'ID del miembro es requerido' });
      }

      if (!req.body || Object.keys(req.body).length === 0) {
        return res
          .status(400)
          .json({ message: 'No se proporcionaron datos para actualizar el miembro guest' });
      }

      const member = await this.guestEnergyService.updateGroupMember(
        getParam(req.params.memberId) || '',
        req.body
      );

      res.status(200).json(member);
    } catch (error) {
      res.status(500).json({ message: 'Error al actualizar el miembro guest del usuario' });
    }
  }

  private async deleteGuestEnergyGroupMember(req: express.Request, res: express.Response) {
    try {
      if (!req.params.memberId) {
        return res.status(400).json({ message: 'ID del miembro es requerido' });
      }

      const member = await this.guestEnergyService.deleteGroupMember(getParam(req.params.memberId) || '');
      res.status(200).json(member);
    } catch (error) {
      res.status(500).json({ message: 'Error al eliminar el miembro guest del usuario' });
    }
  }
}
