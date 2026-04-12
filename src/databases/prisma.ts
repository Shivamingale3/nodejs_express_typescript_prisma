import { PrismaClient, PrismaClientOptions } from '@/generated/prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import pg from 'pg';
import { NODE_ENV, DATABASE_URL } from '@config';

const { Pool } = pg;

declare global {
  var prisma: PrismaClient | undefined;
}

interface RetryOptions {
  maxRetries: number;
  baseDelayMs: number;
}

const DEFAULT_RETRY_OPTIONS: RetryOptions = {
  maxRetries: 5,
  baseDelayMs: 1000,
};

const sleep = (ms: number): Promise<void> => new Promise(resolve => setTimeout(resolve, ms));

const createPrismaClient = (): PrismaClient => {
  const connectionString = DATABASE_URL;

  if (!connectionString) {
    throw new Error('DATABASE_URL environment variable is not set');
  }

  const pool = new Pool({
    connectionString,
    max: 20,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 5000,
  });

  pool.on('error', err => {
    console.error('[DB] Unexpected pool error:', err.message);
  });

  const adapter = new PrismaPg(pool);

  const clientOptions: PrismaClientOptions = {
    adapter,
    log: NODE_ENV === 'development' ? ['query', 'info', 'warn', 'error'] : ['warn', 'error'],
  };

  return new PrismaClient(clientOptions);
};

/**
 * Connect to database with exponential backoff retry.
 * Uses Prisma's public $connect() method.
 */
const connectWithRetry = async (client: PrismaClient, options: RetryOptions = DEFAULT_RETRY_OPTIONS): Promise<void> => {
  let lastError: Error | null = null;

  for (let attempt = 1; attempt <= options.maxRetries; attempt++) {
    try {
      await client.$connect();
      return;
    } catch (err) {
      lastError = err as Error;
      const delay = options.baseDelayMs * Math.pow(2, attempt - 1);

      if (attempt < options.maxRetries) {
        console.warn(`[DB] Connection attempt ${attempt}/${options.maxRetries} failed: ${lastError.message}. Retrying in ${delay}ms...`);
        await sleep(delay);
      }
    }
  }

  throw new Error(`Failed to connect after ${options.maxRetries} attempts: ${lastError?.message}`);
};

const prisma = globalThis.prisma ?? createPrismaClient();

if (NODE_ENV !== 'production') {
  globalThis.prisma = prisma;
}

export { connectWithRetry };
export default prisma;
