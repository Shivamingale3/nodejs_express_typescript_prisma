import { JwtPayload, TokenData } from '@interfaces/auth.interface';
import { User } from '@interfaces/users.interface';
import jwt from 'jsonwebtoken';
import { compare, hash } from 'bcrypt';
import prisma from '@databases/prisma';
import { SECRET_KEY } from '@/config';
import { jwtConfig } from '@/config/jwt.config';

class AuthService {
  /**
   * Create access token from user
   * Uses the JWT payload from @interfaces/auth.interface - modify there to change token claims
   */
  public createAccessToken(user: User): TokenData {
    const payload: JwtPayload = { userId: user.userId };
    const expiresIn = this.parseExpiresIn(jwtConfig.expiresIn);

    return {
      token: jwt.sign(payload, SECRET_KEY, { algorithm: jwtConfig.algorithm as jwt.SignAlgorithm, expiresIn: jwtConfig.expiresIn }),
      expiresIn,
    };
  }

  /**
   * Create refresh token from user
   */
  public createRefreshToken(user: User): TokenData {
    const payload: JwtPayload = { userId: user.userId };
    const expiresIn = this.parseExpiresIn(jwtConfig.refreshExpiresIn);

    return {
      token: jwt.sign(payload, SECRET_KEY, { algorithm: jwtConfig.algorithm as jwt.SignAlgorithm, expiresIn: jwtConfig.refreshExpiresIn }),
      expiresIn,
    };
  }

  /**
   * Verify a token and return the payload
   */
  public verifyToken(token: string): JwtPayload {
    return jwt.verify(token, SECRET_KEY, { algorithms: [jwtConfig.algorithm as jwt.Algorithm] }) as JwtPayload;
  }

  /**
   * Create access and refresh token pair
   */
  public createTokenPair(user: User): { accessToken: TokenData; refreshToken: TokenData } {
    return {
      accessToken: this.createAccessToken(user),
      refreshToken: this.createRefreshToken(user),
    };
  }

  public async signup(userData: { email: string; password: string; name?: string }): Promise<User> {
    const existingUser = await prisma.user.findUnique({ where: { email: userData.email } });
    if (existingUser) {
      throw Object.assign(new Error('User with this email already exists'), { status: 409 });
    }

    const hashedPassword = await hash(userData.password, 10);
    const user = await prisma.user.create({
      data: { ...userData, password: hashedPassword },
    });

    return user as unknown as User;
  }

  public async login(userData: { email: string; password: string }): Promise<{ accessToken: TokenData; refreshToken: TokenData; user: User }> {
    const findUser = await prisma.user.findUnique({ where: { email: userData.email } });
    if (!findUser) {
      throw Object.assign(new Error('Invalid credentials'), { status: 401 });
    }

    const isPasswordMatching = await compare(userData.password, findUser.password);
    if (!isPasswordMatching) {
      throw Object.assign(new Error('Invalid credentials'), { status: 401 });
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
      throw Object.assign(new Error('Invalid refresh token'), { status: 401 });
    }

    const user = await prisma.user.findUnique({ where: { userId: payload.userId } });
    if (!user) {
      throw Object.assign(new Error('User not found'), { status: 401 });
    }

    const tokens = this.createTokenPair(user as unknown as User);

    return {
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken,
      user: user as unknown as User,
    };
  }

  /**
   * Parse expiresIn string (e.g., '1h', '7d', '15m') to seconds
   */
  private parseExpiresIn(expiresIn: string): number {
    const match = expiresIn.match(/^(\d+)([smhd])$/);
    if (!match) {
      return 3600; // Default to 1 hour
    }

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

export default AuthService;
