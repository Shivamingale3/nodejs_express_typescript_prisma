import { config } from 'dotenv';

const envFile = `.env.${process.env.NODE_ENV || 'development'}.local`;
const result = config({ path: envFile });

// Fallback to .env if the environment-specific file doesn't exist
if (result.error) {
  config({ path: '.env' });
}

export const CREDENTIALS = process.env.CREDENTIALS === 'true';
export const { NODE_ENV, PORT, DATABASE_URL, SECRET_KEY, LOG_FORMAT, LOG_DIR, ORIGIN } = process.env;
