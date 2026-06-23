import { Prisma } from "@prisma/client";
import { ValidationError } from "../utils/customErrors";

export class CreateNameValidator {
    static validateCreateData(data: Prisma.ConsultantCreateNameCreateInput): void {
        if(data.isPerson && data.isPerson === true ) {
            if(!data.lastName) {
                throw new ValidationError('Last name is required');
            }
            if(!data.scdLastName) {
                throw new ValidationError('Second last name is required');
            }
        }
        if(!data.name){
            throw new ValidationError('Name is required');
        }
        if(!data.birthDate){
            throw new ValidationError('Birth date is required');
        }
    }
    static validateUpdateData(data: Prisma.ConsultantCreateNameUpdateInput, id: string): void {
        if(!id){
            throw new ValidationError('ID is required');
        }
        this.validateCreateData(data as Prisma.ConsultantCreateNameCreateInput);
    }
}