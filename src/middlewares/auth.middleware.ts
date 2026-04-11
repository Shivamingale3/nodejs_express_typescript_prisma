import { Response } from 'express';
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

    if (authToken) {
      const secretKey: string = SECRET_KEY ?? '';
      const verificationResponse = jwt.verify(authToken, secretKey, { algorithms: [jwtConfig.algorithm] }) as JwtPayload;
      const userId = verificationResponse.userId;
      const findUser = await prisma.user.findUnique({ where: { userId } });

      if (findUser) {
        req.user = findUser as unknown as User;
        next();
      } else {
        next(new HttpException(401, 'Wrong authentication token'));
      }
    } else {
      next(new HttpException(404, 'Authentication token missing'));
    }
  } catch (_error) {
    next(new HttpException(401, 'Wrong authentication token'));
  }
};

export default authMiddleware;
