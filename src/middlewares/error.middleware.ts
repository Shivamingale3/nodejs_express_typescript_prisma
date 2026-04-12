import { NextFunction, Request, Response } from 'express';
import { HttpException } from '@exceptions/HttpException';
import { logger } from '@utils/logger';

const errorMiddleware = (error: HttpException, req: Request, res: Response, _next: NextFunction) => {
  const status: number = error.status || 500;
  const errorCode: string = error.errorCode ?? `ERR_${status}`;
  const message: string = error.message || 'Something went wrong';

  logger.error(`[${req.method}] ${req.path} >> StatusCode:: ${status}, Message:: ${message}`);

  const isDev = process.env.NODE_ENV === 'development';

  res.status(status).json({
    success: false,
    error: {
      code: errorCode,
      message,
      ...(isDev && { stack: error.stack }),
    },
  });
};

export default errorMiddleware;
