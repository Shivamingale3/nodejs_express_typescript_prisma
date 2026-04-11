import { Request } from 'express';
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
 * Data stored in token (alias for backwards compatibility)
 * @deprecated Use JwtPayload instead
 */
export type DataStoredInToken = JwtPayload;

/**
 * Token data returned from token creation
 */
export interface TokenData {
  token: string;
  expiresIn: number;
}

/**
 * Request with user attached by auth middleware
 */
export interface RequestWithUser extends Request {
  user: import('@interfaces/users.interface').User;
}

/**
 * Token pair for access and refresh tokens
 */
export interface TokenPair {
  accessToken: TokenData;
  refreshToken: TokenData;
}
