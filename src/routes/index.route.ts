import { Router } from 'express';
import indexController from '@controllers/index.controller';
import { Routes } from '@interfaces/routes.interface';

class IndexRoute implements Routes {
  public path = '/';
  public router = Router();

  constructor() {
    this.initializeRoutes();
  }

  private initializeRoutes() {
    this.router.get(`${this.path}`, indexController.index);
  }
}

// Module-level singleton
const indexRoute = new IndexRoute();
export default indexRoute;
