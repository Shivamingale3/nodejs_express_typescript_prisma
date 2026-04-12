import request from 'supertest';
import App from '@/app';
import indexRoute from '@routes/index.route';
import healthRoute from '@routes/health.route';

beforeAll(() => {
  jest.setTimeout(5000);
});
afterAll(async () => {
  await new Promise<void>(resolve => setTimeout(() => resolve(), 500));
});

describe('Testing Index', () => {
  describe('[GET] /', () => {
    it('should return 200', async () => {
      const app = new App([indexRoute]);
      const response = await request(app.getServer()).get('/');

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
    });
  });
});

describe('Testing Health', () => {
  describe('[GET] /health/live', () => {
    it('should return 200', async () => {
      const app = new App([healthRoute]);
      const response = await request(app.getServer()).get('/health/live');

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.status).toBe('ok');
    });
  });

  describe('[GET] /health/ready', () => {
    it('should return health status', async () => {
      const app = new App([healthRoute]);
      const response = await request(app.getServer()).get('/health/ready');

      expect(response.status).toBeGreaterThanOrEqual(200);
      expect(response.body.data).toHaveProperty('checks');
      expect(response.body.data).toHaveProperty('healthy');
    });
  });
});
