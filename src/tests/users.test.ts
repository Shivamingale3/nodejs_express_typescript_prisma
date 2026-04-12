import request from 'supertest';
import App from '@/app';
import usersRoute from '@routes/users.route';
import authRoute from '@routes/auth.route';

beforeAll(() => {
  jest.setTimeout(5000);
});
afterAll(async () => {
  await new Promise<void>(resolve => setTimeout(() => resolve(), 500));
});

describe('Testing Users', () => {
  describe('[GET] /users', () => {
    it('should return 200 with paginated users', async () => {
      const app = new App([usersRoute]);
      const response = await request(app.getServer()).get('/users');

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.users).toBeInstanceOf(Array);
      expect(response.body.meta).toBeDefined();
    });

    it('should respect pagination params', async () => {
      const app = new App([usersRoute]);
      const response = await request(app.getServer()).get('/users?page=1&limit=5');

      expect(response.status).toBe(200);
      expect(response.body.meta.limit).toBe(5);
    });
  });

  describe('[GET] /users/:id', () => {
    it('should return 400 for invalid ULID', async () => {
      const app = new App([usersRoute]);
      const response = await request(app.getServer()).get('/users/invalid-id');

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
    });

    it('should return 404 for non-existent user', async () => {
      const app = new App([usersRoute]);
      // Valid ULID format but non-existent
      const response = await request(app.getServer()).get('/users/01ARZ3NDEKTSV4RRFFQ69G5FAV');

      expect(response.status).toBe(404);
      expect(response.body.success).toBe(false);
    });
  });

  describe('[POST] /users', () => {
    it('should create a user and return 201', async () => {
      const app = new App([usersRoute, authRoute]);

      const email = `user${Date.now()}@email.com`;
      const signupRes = await request(app.getServer()).post('/signup').send({ email, password: 'q1w2e3r4!' });

      const token = signupRes.body.data.accessToken;

      const response = await request(app.getServer())
        .post('/users')
        .set('Authorization', `Bearer ${token}`)
        .send({ email: `new${email}`, password: 'q1w2e3r4!' });

      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
    });

    it('should return 401 without auth token', async () => {
      const app = new App([usersRoute]);
      const response = await request(app.getServer()).post('/users').send({ email: 'test@email.com', password: 'q1w2e3r4!' });

      expect(response.status).toBe(401);
      expect(response.body.success).toBe(false);
    });
  });

  describe('[PUT] /users/:id', () => {
    it('should return 400 for invalid ULID', async () => {
      const app = new App([usersRoute]);
      const response = await request(app.getServer()).put('/users/invalid-id').send({ name: 'Test' });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
    });
  });

  describe('[DELETE] /users/:id', () => {
    it('should return 400 for invalid ULID', async () => {
      const app = new App([usersRoute]);
      const response = await request(app.getServer()).delete('/users/invalid-id');

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
    });
  });
});
