import { CreateUserDto } from '@dtos/users.dto';
import { User } from '@interfaces/users.interface';
import prisma from '@databases/prisma';

interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

class UserService {
  public async findAllUser(page: number = 1, limit: number = 20): Promise<{ users: User[]; meta: PaginationMeta }> {
    const skip = (page - 1) * limit;

    const [users, total] = await Promise.all([
      prisma.user.findMany({
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        select: {
          userId: true,
          email: true,
          name: true,
          role: true,
          createdAt: true,
          updatedAt: true,
        },
      }),
      prisma.user.count(),
    ]);

    return {
      users: users as unknown as User[],
      meta: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  public async findUserById(userId: string): Promise<User | null> {
    const user = await prisma.user.findUnique({
      where: { userId },
      select: {
        userId: true,
        email: true,
        name: true,
        role: true,
        createdAt: true,
        updatedAt: true,
      },
    });
    return user as unknown as User | null;
  }

  public async createUser(userData: CreateUserDto): Promise<User> {
    const user = await prisma.user.create({ data: userData });
    return user as unknown as User;
  }

  public async updateUser(userId: string, userData: Partial<CreateUserDto>): Promise<User> {
    const user = await prisma.user.update({ where: { userId }, data: userData });
    return user as unknown as User;
  }

  public async deleteUser(userId: string): Promise<void> {
    await prisma.user.delete({ where: { userId } });
  }
}

// Module-level singleton
const userService = new UserService();
export default userService;
