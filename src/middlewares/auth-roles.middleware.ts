import { RequestHandler } from 'express';
import authMiddleware from '@middlewares/auth.middleware';
import { rolesMiddleware } from '@middlewares/roles.middleware';

/**
 * Combined auth + roles middleware for protected routes
 * Usage: this.router.get('/admin', authRolesMiddleware, controller.handler)
 */
export const authRolesMiddleware: RequestHandler[] = [authMiddleware as RequestHandler, rolesMiddleware];
