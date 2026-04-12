import { NextFunction, Request, Response } from 'express';
import { CreateUserDto } from '@dtos/users.dto';
import { RequestWithUser } from '@interfaces/auth.interface';
import authService from '@services/auth.service';
import { cookieService } from '@services/cookie.service';
import { apiSuccess, apiError } from '@utils/response';

class AuthController {
  public signUp = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const userData: CreateUserDto = req.body;
      const user = await authService.signup(userData);

      apiSuccess(res, { user }, 'User created successfully', undefined, 201);
    } catch (error) {
      next(error);
    }
  };

  public logIn = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const userData: CreateUserDto = req.body;
      const { accessToken, refreshToken, user } = await authService.login(userData);

      cookieService.setCookies(res, accessToken.token, refreshToken.token, accessToken.expiresIn, refreshToken.expiresIn);

      apiSuccess(
        res,
        {
          user: {
            userId: user.userId,
            email: user.email,
            name: user.name,
            role: user.role,
          },
          accessToken: accessToken.token,
          refreshToken: refreshToken.token,
        },
        'Login successful',
      );
    } catch (error) {
      next(error);
    }
  };

  public logOut = async (req: RequestWithUser, res: Response, next: NextFunction) => {
    try {
      await authService.logout();
      cookieService.clearCookies(res);

      apiSuccess(res, null, 'Logged out successfully');
    } catch (error) {
      next(error);
    }
  };

  public refreshToken = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const refreshToken = req.cookies['RefreshToken'] || req.header('X-Refresh-Token');
      if (!refreshToken) {
        apiError(res, 'AUTH_MISSING_REFRESH_TOKEN', 'Refresh token is required', 400);
        return;
      }

      const { accessToken, refreshToken: newRefreshToken, user } = await authService.refreshTokens(refreshToken);
      cookieService.setCookies(res, accessToken.token, newRefreshToken.token, accessToken.expiresIn, newRefreshToken.expiresIn);

      apiSuccess(
        res,
        {
          user: {
            userId: user.userId,
            email: user.email,
            name: user.name,
            role: user.role,
          },
          accessToken: accessToken.token,
          refreshToken: newRefreshToken.token,
        },
        'Token refreshed successfully',
      );
    } catch (error) {
      next(error);
    }
  };
}

// Module-level singleton
const authController = new AuthController();
export default authController;
