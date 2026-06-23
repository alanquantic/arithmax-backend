import {ConsultantPartnerDataModel, ConsultantPartnerDataPartnerModel}from '../models/consultantPartnerDataModel';
import { DatabaseError, NotFoundError, ValidationError } from "../utils/customErrors";
import { Prisma, PrismaClient } from "@prisma/client";

const prisma =  new PrismaClient();

export class ConsultantPartnerDataRepository {
    async create(data: Prisma.ConsultantPartnerDataCreateInput): Promise<ConsultantPartnerDataModel> {
        if(!data) {
            throw new ValidationError('Partner data is required');
        }
        try{
            return await prisma.consultantPartnerData.create({
                data:data,
            })
        }
        catch(error){
            throw new DatabaseError('Failed to create PartnerData ', error as Error);
        }
    }
    async createPartner(id: string, data: Prisma.ConsultantPartnerDataPartnerCreateInput): Promise<ConsultantPartnerDataPartnerModel>{
        if(!data) {
            throw new ValidationError('Partner data is required');
        }
        if(!id){
            throw new ValidationError('Partner Id is required');
        }
        try{
            return await prisma.consultantPartnerDataPartner.create({
                data:{
                    ...data
                    ,
                    partnerData: {
                        connect: { id }
                    }
                },
            })
        }
        catch(error){
            throw new DatabaseError('Failed to create Partner ', error as Error);
        }
    }

    async update(id: string, data: Prisma.ConsultantPartnerDataUpdateInput): Promise<ConsultantPartnerDataModel>{
        if(!id){
            throw new ValidationError(' PartnerData id is required');
        }
        if(!data){
            throw new ValidationError('PartnerData data is required');
        }
        try{
            return await prisma.consultantPartnerData.update({
                where: { id },
                data
            })
        }
        catch(error){
            if (
                error instanceof Prisma.PrismaClientKnownRequestError &&
                error.code === 'P2025'
            ) {
                throw new NotFoundError('PartnerData not found');
            }
            throw new DatabaseError('Failed to update PartnerData ', error as Error);
        }
    }

    async delete(id: string): Promise<ConsultantPartnerDataModel>{
        if(!id){
            throw new ValidationError('PartnerData id is required');
        }
        try{
            return await prisma.consultantPartnerData.delete({
                where: { id }
            })
        }
        catch(error){
            if (
                error instanceof Prisma.PrismaClientKnownRequestError &&
                error.code === 'P2025'
            ) {
                throw new NotFoundError('PartnerData not found');
            }
            throw new DatabaseError('Failed to delete PartnerData', error as Error);
        }
    }

    async get(id: string): Promise<ConsultantPartnerDataModel>{
        if(!id){
            throw new ValidationError(' PartnerData id is required');
        }
        try{
            const partnerData =  await prisma.consultantPartnerData.findUnique({
                where: {id},
            });
            if(!partnerData){
                throw new NotFoundError('PartnerData not found');
            }
            return partnerData;
        }
        catch(error){
            if (error instanceof NotFoundError) {
                throw error;
            }
            throw new DatabaseError('Failed to get PartnerData', error as Error);
        }
    }
    async getAll(consultantId: string): Promise<ConsultantPartnerDataModel[]>{
        if(!consultantId){
            throw new ValidationError('Consultant ID is required');
        }
        try{
            return await prisma.consultantPartnerData.findMany({
                where: {
                    consultantId: consultantId
                }
            });
        }
        catch(error){
            throw new DatabaseError('Failed to get all PartnerData', error as Error);
        }
    }
}
