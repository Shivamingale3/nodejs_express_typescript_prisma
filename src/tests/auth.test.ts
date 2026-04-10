import request from 'supertest';
import App from '@/app';
import { CreateUserDto } from '@dtos/users.dto';
import AuthRoute from '@routes/auth.route';

beforeAll(async () => {
  jest.setTimeout(10000);
});
afterAll(async () => {
  await new Promise<void>(resolve => setTimeout(() => resolve(), 500));
});

describe('Testing Auth', () => {
  describe('[POST] /signup', () => {
    it('response should create user and return data', async () => {
      const userData: CreateUserDto = {
        email: 'test@email.com',
        password: 'q1w2e3r4!',
      };

      const authRoute = new AuthRoute();
      const app = new App([authRoute]);
      const response = await request(app.getServer()).post(`${authRoute.path}signup`).send(userData);
      expect(response.status).toBe(201);
    });
  });

  describe('[POST] /login', () => {
    it('response should return data on login', async () => {
      const userData: CreateUserDto = {
        email: 'test@email.com',
        password: 'q1w2e3r4!',
      };

      const authRoute = new AuthRoute();
      const app = new App([authRoute]);
      const response = await request(app.getServer()).post(`${authRoute.path}login`).send(userData);
      expect(response.status).toBe(200);
    });
  });

  describe('[POST] /logout', () => {
    it('response should logout successfully', async () => {
      const authRoute = new AuthRoute();
      const app = new App([authRoute]);
      const response = await request(app.getServer()).post(`${authRoute.path}logout`).set('Cookie', ['Authorization=test']);
      expect(response.status).toBe(200);
    });
  });
});
