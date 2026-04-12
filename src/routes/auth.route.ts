import { Router, RequestHandler } from 'express';
import authController from '@controllers/auth.controller';
import { CreateUserDto } from '@dtos/users.dto';
import { Routes } from '@interfaces/routes.interface';
import validationMiddleware from '@middlewares/validation.middleware';
import authMiddleware from '@middlewares/auth.middleware';

class AuthRoute implements Routes {
  public path = '/';
  public router = Router();

  constructor() {
    this.initializeRoutes();
  }

  private initializeRoutes() {
    this.router.post(`${this.path}signup`, validationMiddleware(CreateUserDto, 'body') as RequestHandler, authController.signUp as RequestHandler);
    this.router.post(`${this.path}login`, validationMiddleware(CreateUserDto, 'body') as RequestHandler, authController.logIn as RequestHandler);
    this.router.post(`${this.path}logout`, authMiddleware as RequestHandler, authController.logOut as RequestHandler);
    this.router.post(`${this.path}refresh`, authController.refreshToken as RequestHandler);
  }
}

// Module-level singleton
const authRoute = new AuthRoute();
export default authRoute;
