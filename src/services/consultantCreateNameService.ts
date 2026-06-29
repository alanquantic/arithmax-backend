import { ConsultantCreateNameRepository } from "../repositories/consultantCreateNameRepository";
import { Prisma } from "@prisma/client";
import { CreateNameValidator } from "../validators/createNameValidator";
import { ConsultantCreateNameModel } from "../models/consultantCreateNameModel";

export class ConsultantCreateNameService {
    private consultantCreateNameRepository: ConsultantCreateNameRepository;
    constructor() {
        this.consultantCreateNameRepository = new ConsultantCreateNameRepository();
    }
    async create(data: Prisma.ConsultantCreateNameUncheckedCreateInput): Promise<ConsultantCreateNameModel> {
        CreateNameValidator.validateCreateData(data as unknown as Prisma.ConsultantCreateNameCreateInput);
        return this.consultantCreateNameRepository.create(data);
    }
    async update(id: string, data: Prisma.ConsultantCreateNameUpdateInput): Promise<ConsultantCreateNameModel> {
        CreateNameValidator.validateUpdateData(data, id);
        return this.consultantCreateNameRepository.update(id, data);
    }
    async get(id: string): Promise<ConsultantCreateNameModel> {
        return this.consultantCreateNameRepository.get(id);
    }
    async getAll(consultantId: string): Promise<ConsultantCreateNameModel[]> {
        return this.consultantCreateNameRepository.getAll(consultantId);
    }
    async delete(id: string): Promise<ConsultantCreateNameModel> {
        return this.consultantCreateNameRepository.delete(id);
    }
}
