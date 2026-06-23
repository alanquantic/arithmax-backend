import { ConsultantCreateNameService } from "../services/consultantCreateNameService";
import { Controller } from "./controller";
import express from 'express';
import { AuthMiddleware } from '../middlewares/authMiddleware';

export class ConsultantCreateNameController extends Controller {
    protected readonly path: string = '/create-names';
    private readonly consultantCreateNameService = new ConsultantCreateNameService();

    protected doInitialize(): void {
        this.post('/:consultantId', AuthMiddleware.authenticate, this.createConsultantCreateName.bind(this));
        this.put('/:id', AuthMiddleware.authenticate, this.updateConsultantCreateName.bind(this));
        this.get('/:id', AuthMiddleware.authenticate, this.getConsultantCreateName.bind(this));
        this.get('/consultant/:consultantId', AuthMiddleware.authenticate, this.getAllConsultantCreateNames.bind(this));
    }
    private async createConsultantCreateName(req: express.Request, res: express.Response) {
        try {
            if (!req.params.consultantId) {
                return res.status(400).json({ message: 'ID del consultor es requerido' });
            }
            const createNameData = {
                ...req.body,
                id: Math.random().toString(36).substring(2, 9),
                consultantId: req.params.consultantId,
            };
            const consultantCreateName = await this.consultantCreateNameService.create(createNameData);
            if (!consultantCreateName) {
                return res.status(400).json({ message: 'Error al crear el nombre del consultor' });
            }
            res.status(201).json(consultantCreateName);
        }
        catch (error) {
            res.status(500).json({ message: error as string });
            console.error(error);
        }
    }
    private async updateConsultantCreateName(req: express.Request, res: express.Response) {
        try {
            if (!req.params.id) {
                return res.status(400).json({ message: 'ID del nombre del consultor es requerido' });
            }
            if (!req.body || Object.keys(req.body).length === 0) {
                return res.status(400).json({ message: 'No se proporcionaron datos para actualizar el nombre del consultor' });
            }
            const consultantCreateName = await this.consultantCreateNameService.update(req.params.id, req.body);
            res.status(200).json(consultantCreateName);
        }
        catch (error) {
            res.status(500).json({ message: 'Error al actualizar el nombre del consultor' });
        }
    }
    private async getConsultantCreateName(req: express.Request, res: express.Response) {
        try {
            const consultantCreateName = await this.consultantCreateNameService.get(req.params.id);
            res.status(200).json(consultantCreateName);
        }
        catch (error) {
            res.status(500).json({ message: 'Error al obtener el nombre del consultor' });
        }
    }
    private async getAllConsultantCreateNames(req: express.Request, res: express.Response) {
        try {
            if (!req.params.consultantId) {
                return res.status(400).json({ message: 'ID del consultor es requerido' });
            }
            const consultantCreateNames = await this.consultantCreateNameService.getAll(req.params.consultantId);
            res.status(200).json(consultantCreateNames);
        }
        catch (error) {
            res.status(500).json({ message: 'Error al obtener todos los nombres del consultor' });
        }
    }
}
