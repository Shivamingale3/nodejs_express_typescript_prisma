import { Response } from 'express';

export interface ApiMeta {
  page?: number;
  limit?: number;
  total?: number;
  [key: string]: unknown;
}

export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
    details?: unknown;
  };
  meta?: ApiMeta;
}

export const apiSuccess = <T>(res: Response, data: T, _message: string = 'OK', meta?: ApiMeta, statusCode: number = 200): Response => {
  return res.status(statusCode).json({
    success: true,
    data,
    meta: meta ? { ...meta } : undefined,
  } satisfies ApiResponse<T>);
};

export const apiError = (res: Response, code: string, message: string, statusCode: number = 500, details?: unknown): Response => {
  return res.status(statusCode).json({
    success: false,
    error: { code, message, details },
  } satisfies ApiResponse);
};
