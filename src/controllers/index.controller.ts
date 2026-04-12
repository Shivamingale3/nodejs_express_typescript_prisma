import { NextFunction, Request, Response } from 'express';
import { apiSuccess } from '@utils/response';

class IndexController {
  public index = (req: Request, res: Response, next: NextFunction) => {
    try {
      apiSuccess(res, { message: 'Server is running' }, 'OK');
    } catch (error) {
      next(error);
    }
  };
}

// Module-level singleton
const indexController = new IndexController();
export default indexController;
