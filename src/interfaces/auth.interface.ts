import { Request } from 'express';
import { ULID, User } from '@interfaces/users.interface';

export interface DataStoredInToken {
  userId: ULID;
}

export interface TokenData {
  token: string;
  expiresIn: number;
}

export interface RequestWithUser extends Request {
  user: User;
}
