import { Router, RequestHandler } from 'express';
import { apiSuccess } from '@utils/response';
import prisma from '@databases/prisma';
import { checkStorageHealth } from '@databases/storage';
import { checkMailHealth } from '@databases/mail';

const router = Router();

// GET /health/live — liveness probe (is the process alive?)
router.get(
  '/health/live' as string,
  ((_req, res) => {
    apiSuccess(res, { status: 'ok' }, 'Process is alive', undefined, 200);
  }) as RequestHandler,
);

// GET /health/ready — readiness probe (are all dependencies connected?)
router.get(
  '/health/ready' as string,
  (async (_req, res) => {
    const checks: Record<string, { healthy: boolean; message: string }> = {
      database: { healthy: false, message: 'unknown' },
      storage: { healthy: false, message: 'unknown' },
      mail: { healthy: false, message: 'unknown' },
    };

    // Check DB
    try {
      await prisma.$queryRaw`SELECT 1`;
      checks.database = { healthy: true, message: 'Database connected' };
    } catch {
      checks.database = { healthy: false, message: 'Database connection failed' };
    }

    // Check S3
    const storageHealth = await checkStorageHealth();
    checks.storage = storageHealth;

    // Check SMTP
    const mailHealth = await checkMailHealth();
    checks.mail = mailHealth;

    const allHealthy = Object.values(checks).every(c => c.healthy);
    const status = allHealthy ? 200 : 503;

    apiSuccess(res, { checks, healthy: allHealthy }, allHealthy ? 'All services ready' : 'One or more services unhealthy', undefined, status);
  }) as RequestHandler,
);

export default router;
