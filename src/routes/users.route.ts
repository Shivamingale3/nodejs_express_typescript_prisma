import { Router, RequestHandler } from 'express';
import UsersController from '@controllers/users.controller';
import { CreateUserDto } from '@dtos/users.dto';
import { Routes } from '@interfaces/routes.interface';
import validationMiddleware from '@middlewares/validation.middleware';
import authMiddleware from '@middlewares/auth.middleware';
import { rolesMiddleware } from '@middlewares/roles.middleware';

class UsersRoute implements Routes {
  public path = '/users';
  public router = Router();
  public usersController = new UsersController();

  constructor() {
    this.initializeRoutes();
  }

  private initializeRoutes() {
    // Public routes - no auth required
    this.router.get(`${this.path}`, this.usersController.getUsers);
    this.router.get(`${this.path}/:id`, this.usersController.getUserById);

    // Authenticated routes
    this.router.post(
      `${this.path}`,
      authMiddleware as RequestHandler,
      validationMiddleware(CreateUserDto, 'body') as RequestHandler,
      this.usersController.createUser,
    );

    // Admin-only routes
    this.router.put(
      `${this.path}/:id`,
      authMiddleware as RequestHandler,
      rolesMiddleware as RequestHandler,
      validationMiddleware(CreateUserDto, 'body', true) as RequestHandler,
      this.usersController.updateUser,
    );

    this.router.delete(`${this.path}/:id`, authMiddleware as RequestHandler, rolesMiddleware as RequestHandler, this.usersController.deleteUser);
  }
}

export default UsersRoute;
