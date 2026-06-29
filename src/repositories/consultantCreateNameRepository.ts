import { Prisma } from "@prisma/client";
import { prisma } from "../lib/prisma";
import { ConsultantCreateNameModel } from "../models/consultantCreateNameModel";
import { DatabaseError, NotFoundError, ValidationError } from "../utils/customErrors";

export class ConsultantCreateNameRepository {
    async create(data: Prisma.ConsultantCreateNameUncheckedCreateInput): Promise<ConsultantCreateNameModel> {
        if (!data) {
            throw new ValidationError('Consultant create name data is required');
        }
        try {
            return await prisma.consultantCreateName.create({
                data: data,
            });
        }
        catch (error) {
            throw new DatabaseError('Failed to create consultant create name', error as Error);
        }
    }
    async update(id: string, data: Prisma.ConsultantCreateNameUpdateInput): Promise<ConsultantCreateNameModel> {
        if (!id) {
            throw new ValidationError('Consultant create name ID is required');
        }
        try {
            return await prisma.consultantCreateName.update({
                where: { id },
                data: data,
            });
        }
        catch (error) {
            throw new DatabaseError('Failed to update consultant create name', error as Error);
        }
    }
    async get(id: string): Promise<ConsultantCreateNameModel> {
        if (!id) {
            throw new ValidationError('Consultant create name ID is required');
        }
        try {
            const createName = await prisma.consultantCreateName.findUnique({
                where: { id },
            });
            if (!createName) {
                throw new NotFoundError('Consultant create name not found');
            }
            return createName;
        }
        catch (error) {
            throw new DatabaseError('Failed to get consultant create name', error as Error);
        }
    }
    async getAll(consultantId: string): Promise<ConsultantCreateNameModel[]> {
        if (!consultantId) {
            throw new ValidationError('Consultant ID is required');
        }
        try {
            return await prisma.consultantCreateName.findMany({
                where: { consultantId },
            });
        }
        catch (error) {
            throw new DatabaseError('Failed to get all consultant create names', error as Error);
        }
    }
    async delete(id: string): Promise<ConsultantCreateNameModel> {
        if (!id) {
            throw new ValidationError('Consultant create name ID is required');
        }
        try {
            return await prisma.consultantCreateName.delete({
                where: { id },
            });
        }
        catch (error) {
            if (
                error instanceof Prisma.PrismaClientKnownRequestError &&
                error.code === 'P2025'
            ) {
                throw new NotFoundError('Consultant create name not found');
            }
            throw new DatabaseError('Failed to delete consultant create name', error as Error);
        }
    }
}
