import { cleanEnv, bool, port, str } from 'envalid';

const validateEnv = () => {
  cleanEnv(process.env, {
    // ─── Server ──────────────────────────────────────
    NODE_ENV: str({
      choices: ['development', 'production', 'test'] as const,
      desc: 'Application environment',
    }),
    PORT: port({
      default: 3000,
      desc: 'Port number the server listens on',
    }),

    // ─── Database (Required) ─────────────────────────
    DATABASE_URL: str({
      desc: 'PostgreSQL connection string (e.g. postgresql://user:pass@host:5432/db)',
    }),

    // ─── Auth (Required) ─────────────────────────────
    SECRET_KEY: str({
      desc: 'JWT signing secret — keep this private',
    }),

    // ─── Logging (Optional — has defaults) ───────────
    LOG_FORMAT: str({
      default: 'dev',
      choices: ['combined', 'common', 'dev', 'short', 'tiny'] as const,
      desc: 'Morgan log format preset',
    }),
    LOG_DIR: str({
      default: '../logs',
      desc: 'Relative path for log file output directory',
    }),

    // ─── CORS (Optional — has defaults) ──────────────
    ORIGIN: str({
      default: '*',
      desc: 'Allowed CORS origin(s)',
    }),
    CREDENTIALS: bool({
      default: false,
      desc: 'Whether to send CORS credentials header',
    }),
  });
};

export default validateEnv;
