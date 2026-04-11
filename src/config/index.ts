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
  NODE_ENV: z.enum(['development', 'staging', 'production', 'test']).default('development'),
  PORT: z.coerce.number().default(5555),
  DATABASE_URL: z.string().min(1, 'DATABASE_URL is required'),
  SECRET_KEY: z.string().min(32, 'SECRET_KEY must be at least 32 characters'),
  JWT_ALGORITHM: z.enum(['HS256', 'HS384', 'HS512']).default('HS256'),
  JWT_EXPIRES_IN: z.string().default('1h'),
  JWT_REFRESH_EXPIRES_IN: z.string().default('7d'),
  LOG_FORMAT: z.enum(['combined', 'common', 'dev', 'short', 'tiny']).default('dev'),
  LOG_DIR: z.string().default('../logs'),
  ORIGIN: z.string().default('*'),
  CREDENTIALS: z.coerce.boolean().default(false),
  // Cookie configuration
  COOKIE_AUTH_NAME: z.string().default('Authorization'),
  COOKIE_REFRESH_NAME: z.string().default('RefreshToken'),
  COOKIE_DOMAIN: z.string().optional(),
  COOKIE_SECURE: z.coerce.boolean().optional(),
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
  JWT_ALGORITHM,
  JWT_EXPIRES_IN,
  JWT_REFRESH_EXPIRES_IN,
  LOG_FORMAT,
  LOG_DIR,
  ORIGIN,
  CREDENTIALS,
  COOKIE_AUTH_NAME,
  COOKIE_REFRESH_NAME,
  COOKIE_DOMAIN,
  COOKIE_SECURE,
  S3_ENDPOINT,
  S3_REGION,
  S3_ACCESS_KEY,
  S3_SECRET_KEY,
  S3_BUCKET,
  S3_FORCE_PATH_STYLE,
} = parsedEnv.data;
