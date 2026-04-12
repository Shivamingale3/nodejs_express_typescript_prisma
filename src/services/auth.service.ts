import { JwtPayload, TokenData, TokenPair } from '@interfaces/auth.interface';
import { User } from '@interfaces/users.interface';
import jwt from 'jsonwebtoken';
import { compare, hash } from 'bcrypt';
import prisma from '@databases/prisma';
import { SECRET_KEY } from '@config';
import { jwtConfig } from '@config/jwt.config';
import { HttpException } from '@exceptions/HttpException';

class AuthService {
  public createAccessToken(user: User): TokenData {
    const payload: JwtPayload = { userId: user.userId };
    const expiresIn = this.parseExpiresIn(jwtConfig.expiresIn);

    return {
      token: jwt.sign(payload, SECRET_KEY, {
        algorithm: jwtConfig.algorithm as jwt.Algorithm,
        expiresIn: jwtConfig.expiresIn as jwt.SignOptions['expiresIn'],
      }),
      expiresIn,
    };
  }

  public createRefreshToken(user: User): TokenData {
    const payload: JwtPayload = { userId: user.userId };
    const expiresIn = this.parseExpiresIn(jwtConfig.refreshExpiresIn);

    return {
      token: jwt.sign(payload, SECRET_KEY, {
        algorithm: jwtConfig.algorithm as jwt.Algorithm,
        expiresIn: jwtConfig.refreshExpiresIn as jwt.SignOptions['expiresIn'],
      }),
      expiresIn,
    };
  }

  public verifyToken(token: string): JwtPayload {
    return jwt.verify(token, SECRET_KEY, { algorithms: [jwtConfig.algorithm as jwt.Algorithm] }) as unknown as JwtPayload;
  }

  public createTokenPair(user: User): TokenPair {
    return {
      accessToken: this.createAccessToken(user),
      refreshToken: this.createRefreshToken(user),
    };
  }

  public async signup(userData: { email: string; password: string; name?: string }): Promise<User> {
    try {
      const hashedPassword = await hash(userData.password, 10);
      const user = await prisma.user.create({
        data: { ...userData, password: hashedPassword },
      });
      return user as unknown as User;
    } catch (err: unknown) {
      // Prisma P2002 = unique constraint violation (duplicate email)
      if ((err as { code?: string }).code === 'P2002') {
        throw new HttpException(409, 'Invalid email or password', 'AUTH_EMAIL_EXISTS');
      }
      throw err;
    }
  }

  public async login(userData: { email: string; password: string }): Promise<{ accessToken: TokenData; refreshToken: TokenData; user: User }> {
    const findUser = await prisma.user.findUnique({ where: { email: userData.email } });
    if (!findUser) {
      throw new HttpException(401, 'Invalid email or password', 'AUTH_INVALID_CREDENTIALS');
    }

    const isPasswordMatching = await compare(userData.password, findUser.password);
    if (!isPasswordMatching) {
      throw new HttpException(401, 'Invalid email or password', 'AUTH_INVALID_CREDENTIALS');
    }

    const tokens = this.createTokenPair(findUser as unknown as User);

    return {
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken,
      user: findUser as unknown as User,
    };
  }

  public async logout(): Promise<{ message: string }> {
    return { message: 'Logged out successfully' };
  }

  public async refreshTokens(refreshToken: string): Promise<{ accessToken: TokenData; refreshToken: TokenData; user: User }> {
    let payload: JwtPayload;

    try {
      payload = this.verifyToken(refreshToken);
    } catch {
      throw new HttpException(401, 'Invalid or expired refresh token', 'AUTH_INVALID_REFRESH_TOKEN');
    }

    const user = await prisma.user.findUnique({ where: { userId: payload.userId } });
    if (!user) {
      throw new HttpException(401, 'Invalid or expired refresh token', 'AUTH_USER_NOT_FOUND');
    }

    const tokens = this.createTokenPair(user as unknown as User);

    return {
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken,
      user: user as unknown as User,
    };
  }

  private parseExpiresIn(expiresIn: string): number {
    const match = expiresIn.match(/^(\d+)([smhd])$/);
    if (!match) return 3600;

    const value = parseInt(match[1], 10);
    const unit = match[2];

    switch (unit) {
      case 's':
        return value;
      case 'm':
        return value * 60;
      case 'h':
        return value * 3600;
      case 'd':
        return value * 86400;
      default:
        return 3600;
    }
  }
}

// Module-level singleton — one instance across the entire app
const authService = new AuthService();
export default authService;
