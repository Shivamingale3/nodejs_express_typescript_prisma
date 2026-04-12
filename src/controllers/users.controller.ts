import { NextFunction, Request, Response } from 'express';
import { CreateUserDto } from '@dtos/users.dto';
import userService from '@services/users.service';
import { apiSuccess, apiError } from '@utils/response';
import { isULID } from '@interfaces/users.interface';

class UsersController {
  public getUsers = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const page = parseInt(String(req.query['page'] ?? '1'), 10);
      const limit = parseInt(String(req.query['limit'] ?? '20'), 10);

      const validPage = isNaN(page) || page < 1 ? 1 : page;
      const validLimit = isNaN(limit) || limit < 1 ? 20 : limit > 100 ? 100 : limit;

      const { users, meta } = await userService.findAllUser(validPage, validLimit);

      apiSuccess(res, { users }, 'Users retrieved successfully', meta);
    } catch (error) {
      next(error);
    }
  };

  public getUserById = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const userId: string = req.params.id;

      if (!isULID(userId)) {
        apiError(res, 'VALIDATION_INVALID_ID', 'Invalid user ID format', 400);
        return;
      }

      const user = await userService.findUserById(userId);

      if (!user) {
        apiError(res, 'USER_NOT_FOUND', 'User not found', 404);
        return;
      }

      apiSuccess(res, { user }, 'User retrieved successfully');
    } catch (error) {
      next(error);
    }
  };

  public createUser = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const userData: CreateUserDto = req.body;
      const user = await userService.createUser(userData);

      apiSuccess(res, { user }, 'User created successfully', undefined, 201);
    } catch (error) {
      next(error);
    }
  };

  public updateUser = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const userId: string = req.params.id;
      const userData: Partial<CreateUserDto> = req.body;

      if (!isULID(userId)) {
        apiError(res, 'VALIDATION_INVALID_ID', 'Invalid user ID format', 400);
        return;
      }

      const user = await userService.updateUser(userId, userData);

      apiSuccess(res, { user }, 'User updated successfully');
    } catch (error) {
      next(error);
    }
  };

  public deleteUser = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const userId: string = req.params.id;

      if (!isULID(userId)) {
        apiError(res, 'VALIDATION_INVALID_ID', 'Invalid user ID format', 400);
        return;
      }

      await userService.deleteUser(userId);

      apiSuccess(res, null, 'User deleted successfully');
    } catch (error) {
      next(error);
    }
  };
}

// Module-level singleton
const usersController = new UsersController();
export default usersController;
