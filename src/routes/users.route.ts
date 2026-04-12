import { Router, RequestHandler } from 'express';
import usersController from '@controllers/users.controller';
import { CreateUserDto } from '@dtos/users.dto';
import { Routes } from '@interfaces/routes.interface';
import validationMiddleware from '@middlewares/validation.middleware';
import authMiddleware from '@middlewares/auth.middleware';
import { rolesMiddleware } from '@middlewares/roles.middleware';

class UsersRoute implements Routes {
  public path = '/users';
  public router = Router();

  constructor() {
    this.initializeRoutes();
  }

  private initializeRoutes() {
    this.router.get(`${this.path}`, usersController.getUsers as RequestHandler);
    this.router.get(`${this.path}/:id`, usersController.getUserById as RequestHandler);

    this.router.post(
      `${this.path}`,
      authMiddleware as RequestHandler,
      validationMiddleware(CreateUserDto, 'body') as RequestHandler,
      usersController.createUser as RequestHandler,
    );

    this.router.put(
      `${this.path}/:id`,
      authMiddleware as RequestHandler,
      rolesMiddleware as RequestHandler,
      validationMiddleware(CreateUserDto, 'body', true) as RequestHandler,
      usersController.updateUser as RequestHandler,
    );

    this.router.delete(
      `${this.path}/:id`,
      authMiddleware as RequestHandler,
      rolesMiddleware as RequestHandler,
      usersController.deleteUser as RequestHandler,
    );
  }
}

// Module-level singleton
const usersRoute = new UsersRoute();
export default usersRoute;
