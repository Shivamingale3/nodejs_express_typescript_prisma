import { SetMetadata } from '@nestjs/common';
import { UserRole } from '@/generated/prisma/enums';

/**
 * Role decorator for RBAC
 * Usage: @Roles(UserRole.ADMIN) or @Roles(UserRole.ADMIN, UserRole.MEMBER)
 */
export const ROLES_KEY = 'roles';
export const Roles = (...roles: UserRole[]) => SetMetadata(ROLES_KEY, roles);
