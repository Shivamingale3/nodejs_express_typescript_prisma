import { ULID } from '@interfaces/users.interface';

/**
 * JWT Payload Interface
 * Modify this interface to change what data is stored in JWT tokens.
 * All token creation and verification flows will automatically use these fields.
 */
export interface JwtPayload {
  userId: ULID;
}

/**
 * Token configuration - single place to configure JWT behavior
 */
export const jwtConfig = {
  /** Algorithm for signing tokens (use HS256 for symmetric, HS512 for stronger) */
  algorithm: process.env.JWT_ALGORITHM || 'HS256',
  /** Access token expiration in seconds (e.g., 900 = 15 minutes, 3600 = 1 hour) */
  expiresIn: process.env.JWT_EXPIRES_IN || '1h',
  /** Refresh token expiration in seconds (e.g., 604800 = 7 days, 2592000 = 30 days) */
  refreshExpiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '7d',
} as const;

/** Type for JWT configuration options */
export type JwtConfig = typeof jwtConfig;
