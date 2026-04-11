import { Router, RequestHandler } from 'express';
import AuthController from '@controllers/auth.controller';
import { CreateUserDto } from '@dtos/users.dto';
import { Routes } from '@interfaces/routes.interface';
import authMiddleware from '@middlewares/auth.middleware';
import validationMiddleware from '@middlewares/validation.middleware';

class AuthRoute implements Routes {
  public path = '/';
  public router = Router();
  public authController = new AuthController();

  constructor() {
    this.initializeRoutes();
  }

  private initializeRoutes() {
    this.router.post(
      `${this.path}signup`,
      validationMiddleware(CreateUserDto, 'body') as RequestHandler,
      this.authController.signUp as RequestHandler,
    );
    this.router.post(`${this.path}login`, validationMiddleware(CreateUserDto, 'body') as RequestHandler, this.authController.logIn as RequestHandler);
    this.router.post(`${this.path}logout`, authMiddleware as RequestHandler, this.authController.logOut as RequestHandler);
    this.router.post(`${this.path}refresh`, this.authController.refreshToken as RequestHandler);
  }
}

export default AuthRoute;
