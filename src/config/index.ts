import { config } from 'dotenv';
import { z } from 'zod';

const envFile = `.env.${process.env.NODE_ENV || 'development'}.local`;
const result = config({ path: envFile });

// Fallback to .env if the environment-specific file doesn't exist
if (result.error) {
  config({ path: '.env' });
}

// Define the schema for environment variables
const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  PORT: z.coerce.number().default(5555),
  DATABASE_URL: z.string().min(1, 'DATABASE_URL is required'),
  SECRET_KEY: z.string().min(1, 'SECRET_KEY is required'),
  LOG_FORMAT: z.enum(['combined', 'common', 'dev', 'short', 'tiny']).default('dev'),
  LOG_DIR: z.string().default('../logs'),
  ORIGIN: z.string().default('*'),
  CREDENTIALS: z.coerce.boolean().default(false),
  // S3/Object Storage
  S3_ENDPOINT: z.string().optional(),
  S3_REGION: z.string().default('us-east-1'),
  S3_ACCESS_KEY: z.string().optional(),
  S3_SECRET_KEY: z.string().optional(),
  S3_BUCKET: z.string().min(1, 'S3_BUCKET is required'),
  S3_FORCE_PATH_STYLE: z.coerce.boolean().default(false),
});

// Parse the environment variables
const parsedEnv = envSchema.safeParse(process.env);

if (!parsedEnv.success) {
  console.error('❌ Invalid environment variables:');
  const errors = parsedEnv.error.format();

  for (const [key, value] of Object.entries(errors)) {
    if (key !== '_errors' && value && typeof value === 'object' && '_errors' in value) {
      console.error(`  - ${key}: ${(value as { _errors: string[] })._errors.join(', ')}`);
    }
  }
  process.exit(1);
}

// Export the validated variables
export const {
  NODE_ENV,
  PORT,
  DATABASE_URL,
  SECRET_KEY,
  LOG_FORMAT,
  LOG_DIR,
  ORIGIN,
  CREDENTIALS,
  S3_ENDPOINT,
  S3_REGION,
  S3_ACCESS_KEY,
  S3_SECRET_KEY,
  S3_BUCKET,
  S3_FORCE_PATH_STYLE,
} = parsedEnv.data;
