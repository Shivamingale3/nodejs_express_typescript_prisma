import jwt from 'jsonwebtoken';
import { HttpException } from '@exceptions/HttpException';
import { NextFunction, Request, Response } from 'express';

export const NODE_ENV = process.env.NODE_ENV || 'development';
const CSRF_SECRET = process.env.CSRF_SECRET || 'csrf-secret-change-in-production';

/**
 * Generate a CSRF token for the current session
 */
export const generateCsrfToken = (sessionId: string): string => {
  return jwt.sign({ sessionId, type: 'csrf' }, CSRF_SECRET, { expiresIn: '1h' });
};

/**
 * Validate a CSRF token from request headers
 */
export const validateCsrfToken = (token: string, sessionId: string): boolean => {
  try {
    const decoded = jwt.verify(token, CSRF_SECRET) as { sessionId: string; type: string };
    return decoded.sessionId === sessionId && decoded.type === 'csrf';
  } catch {
    return false;
  }
};

/**
 * CSRF Protection Middleware
 * Validates CSRF token for state-changing requests (POST, PUT, DELETE, PATCH)
 */
export const csrfMiddleware = (req: Request, _res: Response, next: NextFunction) => {
  // Only validate for state-changing methods
  if (['POST', 'PUT', 'DELETE', 'PATCH'].includes(req.method.toUpperCase())) {
    const csrfToken = req.header('X-CSRF-Token') || req.header('x-csrf-token');
    const sessionId = req.header('X-Session-Id') || req.cookies['sessionId'];

    if (!csrfToken) {
      next(new HttpException(403, 'CSRF token is required'));
      return;
    }

    if (!sessionId) {
      next(new HttpException(403, 'Session ID is required'));
      return;
    }

    if (!validateCsrfToken(csrfToken, sessionId)) {
      next(new HttpException(403, 'Invalid CSRF token'));
      return;
    }
  }

  next();
};
