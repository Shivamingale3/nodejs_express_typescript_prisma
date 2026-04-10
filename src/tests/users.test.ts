import request from 'supertest';
import App from '@/app';
import { CreateUserDto } from '@dtos/users.dto';
import UsersRoute from '@routes/users.route';

beforeAll(async () => {
  jest.setTimeout(10000);
});
afterAll(async () => {
  await new Promise<void>(resolve => setTimeout(() => resolve(), 500));
});

describe('Testing Users', () => {
  describe('[GET] /users', () => {
    it('response findAll Users', async () => {
      const usersRoute = new UsersRoute();
      const app = new App([usersRoute]);
      const response = await request(app.getServer()).get(`${usersRoute.path}`);
      expect(response.status).toBe(200);
    });
  });

  describe('[GET] /users/:id', () => {
    it('response findOne User', async () => {
      const userId = 'qpwoeiruty';
      const usersRoute = new UsersRoute();
      const app = new App([usersRoute]);
      const response = await request(app.getServer()).get(`${usersRoute.path}/${userId}`);
      expect(response.status).toBe(200);
    });
  });

  describe('[POST] /users', () => {
    it('response Create User', async () => {
      const userData: CreateUserDto = {
        email: 'test@email.com',
        password: 'q1w2e3r4',
      };

      const usersRoute = new UsersRoute();
      const app = new App([usersRoute]);
      const response = await request(app.getServer()).post(`${usersRoute.path}`).send(userData);
      expect(response.status).toBe(201);
    });
  });

  describe('[PUT] /users/:id', () => {
    it('response Update User', async () => {
      const userId = '60706478aad6c9ad19a31c84';
      const userData: CreateUserDto = {
        email: 'test@email.com',
        password: 'q1w2e3r4',
      };

      const usersRoute = new UsersRoute();
      const app = new App([usersRoute]);
      const response = await request(app.getServer()).put(`${usersRoute.path}/${userId}`).send(userData);
      expect(response.status).toBe(200);
    });
  });

  describe('[DELETE] /users/:id', () => {
    it('response Delete User', async () => {
      const userId = '60706478aad6c9ad19a31c84';

      const usersRoute = new UsersRoute();
      const app = new App([usersRoute]);
      const response = await request(app.getServer()).delete(`${usersRoute.path}/${userId}`);
      expect(response.status).toBe(200);
    });
  });
});
