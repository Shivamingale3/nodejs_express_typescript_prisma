import { hash } from 'bcrypt';
import { CreateUserDto } from '@dtos/users.dto';
import { HttpException } from '@exceptions/HttpException';
import { User } from '@interfaces/users.interface';
import userModel from '@models/users.model';
import { isEmpty } from '@utils/util';

class UserService {
  public users = userModel;

  public async findAllUser(): Promise<User[]> {
    const users: User[] = await this.users.find();
    return users;
  }

  public async findUserById(userId: string): Promise<string> {
    return userId;
  }

  public async createUser(userData: CreateUserDto): Promise<CreateUserDto> {
    return userData;
  }

  public async updateUser(userId: string, userData: CreateUserDto): Promise<{ userId: string; userData: CreateUserDto }> {
    return { userId, userData };
  }

  public async deleteUser(userId: string): Promise<string> {
    return userId;
  }
}

export default UserService;
