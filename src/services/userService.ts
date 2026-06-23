import { Prisma } from '@prisma/client';
import { UserRepository } from '../repositories/userRepository';
import { UserValidator } from '../validators/userValidator';
import { UserModel } from '../models/userModel';

export class UserService {
  private userRepository: UserRepository;

  constructor() {
    this.userRepository = new UserRepository();
  }
  async create(data: Prisma.UserCreateInput): Promise<UserModel> {
    UserValidator.validateCreateData(data);
    return this.userRepository.create(data);
  }
  async update(id: number, data: Prisma.UserUpdateInput): Promise<UserModel> {
    UserValidator.validateUpdateData(data, id);
    return this.userRepository.update(id, data);
  }

  async findById(id: number): Promise<UserModel | null> {
    return this.userRepository.findById(id);
  }
  async findAll(): Promise<UserModel[]> {
    return this.userRepository.findAll();
  }
}
