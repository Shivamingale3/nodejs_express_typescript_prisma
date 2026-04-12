import request from 'supertest';
import App from '@/app';
import authRoute from '@routes/auth.route';

beforeAll(() => {
  jest.setTimeout(5000);
});
afterAll(async () => {
  await new Promise<void>(resolve => setTimeout(() => resolve(), 500));
});

describe('Testing Auth', () => {
  describe('[POST] /signup', () => {
    it('response should create user and return 201', async () => {
      const userData = {
        email: `test${Date.now()}@email.com`,
        password: 'q1w2e3r4!',
      };

      const app = new App([authRoute]);
      const response = await request(app.getServer()).post('/signup').send(userData);

      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
      expect(response.body.data.user.email).toBe(userData.email);
    });

    it('should return 409 for duplicate email', async () => {
      const email = `dup${Date.now()}@email.com`;
      const userData = { email, password: 'q1w2e3r4!' };

      const app = new App([authRoute]);
      await request(app.getServer()).post('/signup').send(userData);

      const response = await request(app.getServer()).post('/signup').send(userData);
      expect(response.status).toBe(409);
      expect(response.body.success).toBe(false);
    });
  });

  describe('[POST] /login', () => {
    it('response should return 200 with tokens on valid credentials', async () => {
      const email = `login${Date.now()}@email.com`;
      const password = 'q1w2e3r4!';

      const app = new App([authRoute]);
      await request(app.getServer()).post('/signup').send({ email, password });

      const response = await request(app.getServer()).post('/login').send({ email, password });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.accessToken).toBeDefined();
      expect(response.body.data.refreshToken).toBeDefined();
    });

    it('should return 401 for invalid credentials', async () => {
      const app = new App([authRoute]);
      const response = await request(app.getServer()).post('/login').send({ email: 'notfound@email.com', password: 'wrong' });

      expect(response.status).toBe(401);
      expect(response.body.success).toBe(false);
    });
  });

  describe('[POST] /logout', () => {
    it('response should return 200', async () => {
      const app = new App([authRoute]);
      const response = await request(app.getServer()).post('/logout').set('Cookie', ['Authorization=test']);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
    });
  });
});
