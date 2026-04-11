import { NextFunction, Request, Response } from 'express';
import { CreateUserDto } from '@dtos/users.dto';
import { RequestWithUser } from '@interfaces/auth.interface';
import AuthService from '@services/auth.service';
import { cookieService } from '@services/cookie.service';

class AuthController {
  public authService = new AuthService();

  public signUp = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const userData: CreateUserDto = req.body;
      const user = await this.authService.signup(userData);

      res.status(201).json({ data: { user }, message: 'signup' });
    } catch (error) {
      next(error);
    }
  };

  public logIn = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const userData: CreateUserDto = req.body;
      const { accessToken, refreshToken, user } = await this.authService.login(userData);

      cookieService.setCookies(res, accessToken.token, refreshToken.token, accessToken.expiresIn, refreshToken.expiresIn);

      res.status(200).json({
        data: {
          user,
          accessToken: accessToken.token,
          refreshToken: refreshToken.token,
        },
        message: 'login',
      });
    } catch (error) {
      next(error);
    }
  };

  public logOut = async (req: RequestWithUser, res: Response, next: NextFunction) => {
    try {
      await this.authService.logout();
      cookieService.clearCookies(res);

      res.status(200).json({ data: null, message: 'logout' });
    } catch (error) {
      next(error);
    }
  };

  public refreshToken = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const refreshToken = req.cookies['RefreshToken'] || req.header('X-Refresh-Token');
      if (!refreshToken) {
        res.status(400).json({ message: 'Refresh token is required' });
        return;
      }

      const { accessToken, refreshToken: newRefreshToken, user } = await this.authService.refreshTokens(refreshToken);
      cookieService.setCookies(res, accessToken.token, newRefreshToken.token, accessToken.expiresIn, newRefreshToken.expiresIn);

      res.status(200).json({
        data: {
          user,
          accessToken: accessToken.token,
          refreshToken: newRefreshToken.token,
        },
        message: 'token_refreshed',
      });
    } catch (error) {
      next(error);
    }
  };
}

export default AuthController;
