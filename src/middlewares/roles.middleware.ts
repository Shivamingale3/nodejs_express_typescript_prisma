import { UserRole } from '@/generated/prisma/enums';
import { NextFunction, Request, Response } from 'express';
import { HttpException } from '@exceptions/HttpException';
import 'reflect-metadata';
import { ROLES_KEY } from '@decorators/roles.decorator';

/**
 * Role-based Access Control (RBAC) Middleware
 * Validates that the authenticated user has one of the required roles
 */
export const rolesMiddleware = (req: Request, res: Response, next: NextFunction) => {
  const requiredRoles = Reflect.getMetadata(ROLES_KEY, req) as UserRole[] | undefined;

  if (!requiredRoles || requiredRoles.length === 0) {
    next();
    return;
  }

  const user = (req as any).user;
  if (!user) {
    next(new HttpException(401, 'Authentication required'));
    return;
  }

  const userRole = user.role as UserRole;
  if (!userRole) {
    next(new HttpException(403, 'No role assigned to user'));
    return;
  }

  if (!requiredRoles.includes(userRole)) {
    next(new HttpException(403, 'Insufficient permissions'));
    return;
  }

  next();
};
