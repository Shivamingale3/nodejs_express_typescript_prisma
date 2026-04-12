import { NextFunction, Response } from 'express';
import jwt from 'jsonwebtoken';
import { SECRET_KEY } from '@config';
import { jwtConfig } from '@config/jwt.config';
import { HttpException } from '@exceptions/HttpException';
import { JwtPayload, RequestWithUser } from '@interfaces/auth.interface';
import { User } from '@interfaces/users.interface';
import prisma from '@databases/prisma';

const authMiddleware = async (req: RequestWithUser, _res: Response, next: NextFunction) => {
  try {
    const authHeader = req.header('Authorization') || '';
    const authToken = req.cookies['Authorization'] || (authHeader.includes('Bearer ') ? authHeader.split('Bearer ')[1] : null);

    if (!authToken) {
      next(new HttpException(401, 'Authentication token missing', 'AUTH_TOKEN_MISSING'));
      return;
    }

    const secretKey: string = SECRET_KEY ?? '';
    const verificationResponse = jwt.verify(authToken, secretKey, { algorithms: [jwtConfig.algorithm as jwt.Algorithm] }) as unknown as JwtPayload;
    const userId = verificationResponse.userId;

    const findUser = await prisma.user.findUnique({
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

    if (!findUser) {
      next(new HttpException(401, 'Invalid authentication token', 'AUTH_INVALID_TOKEN'));
      return;
    }

    req.user = findUser as unknown as User;
    next();
  } catch {
    next(new HttpException(401, 'Invalid authentication token', 'AUTH_INVALID_TOKEN'));
  }
};

export default authMiddleware;
