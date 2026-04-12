import compression from 'compression';
import cookieParser from 'cookie-parser';
import cors from 'cors';
import express, { Express } from 'express';
import helmet from 'helmet';
import hpp from 'hpp';
import morgan from 'morgan';
import swaggerJSDoc from 'swagger-jsdoc';
import swaggerUi from 'swagger-ui-express';
import { NODE_ENV, PORT, LOG_FORMAT, ORIGIN, CREDENTIALS } from '@config';
import { Routes } from '@interfaces/routes.interface';
import errorMiddleware from '@middlewares/error.middleware';
import { logger, stream } from '@utils/logger';
import { parseOrigins } from '@utils/util';
import prisma, { connectWithRetry } from '@databases/prisma';
import { checkStorageHealth } from '@databases/storage';
import { checkMailHealth } from '@databases/mail';
import { csrfMiddleware } from '@middlewares/csrf.middleware';
import healthRoute from '@routes/health.route';

class App {
  public app: Express;
  public server: ReturnType<Express['listen']> | null = null;
  public env: string;
  public port: string | number;

  constructor(routes: Routes[]) {
    this.app = express();
    this.env = NODE_ENV || 'development';
    this.port = PORT || 3000;

    this.initializeMiddlewares();
    this.initializeRoutes(routes);
    this.initializeSwagger();
    this.initializeErrorHandling();
  }

  public async start(): Promise<void> {
    await this.connectToDatabase();
    await this.connectToStorage();
    await this.connectToMail();

    this.server = this.app.listen(this.port, () => {
      logger.info(`=================================`);
      logger.info(`======= ENV: ${this.env} =======`);
      logger.info(`🚀 App listening on the port ${this.port}`);
      logger.info(`=================================`);
    });

    this.initializeGracefulShutdown();
  }

  private async connectToDatabase(): Promise<void> {
    try {
      await connectWithRetry(prisma);
      logger.info('✅ Database connected successfully');
    } catch (error) {
      logger.error('❌ Database connection failed', error);
      throw error;
    }
  }

  private async connectToStorage(): Promise<void> {
    const health = await checkStorageHealth();
    if (health.healthy) {
      logger.info(`✅ ${health.message}`);
    } else {
      logger.warn(`⚠️  ${health.message}`);
    }
  }

  private async connectToMail(): Promise<void> {
    const health = await checkMailHealth();
    if (health.healthy) {
      logger.info(`✅ ${health.message}`);
    } else {
      logger.warn(`⚠️  ${health.message}`);
    }
  }

  private initializeGracefulShutdown(): void {
    const shutdown = async (signal: string) => {
      logger.info(`${signal} received. Shutting down gracefully...`);

      if (this.server) {
        this.server.close(async () => {
          logger.info('✅ HTTP server closed');

          try {
            await prisma.$disconnect();
            logger.info('✅ Database connection closed');
          } catch (error) {
            logger.error('❌ Error closing database connection', error);
          }

          process.exit(0);
        });

        // Force exit after 30s if graceful shutdown stalls
        setTimeout(() => {
          logger.error('❌ Graceful shutdown timed out, forcing exit');
          process.exit(1);
        }, 30000);
      } else {
        try {
          await prisma.$disconnect();
        } catch {}
        process.exit(0);
      }
    };

    process.on('SIGTERM', () => shutdown('SIGTERM'));
    process.on('SIGINT', () => shutdown('SIGINT'));
  }

  public getServer() {
    return this.app;
  }

  private initializeMiddlewares() {
    this.app.use(morgan(LOG_FORMAT ?? 'dev', { stream }));
    this.app.use(cors({ origin: parseOrigins(ORIGIN), credentials: CREDENTIALS }));
    this.app.use(hpp());
    this.app.use(helmet());
    this.app.use(compression());
    this.app.use(express.json({ limit: '10kb' }));
    this.app.use(express.urlencoded({ extended: true }));
    this.app.use(cookieParser());
    this.app.use(csrfMiddleware);
  }

  private initializeRoutes(routes: Routes[]) {
    this.app.use('/', healthRoute);
    routes.forEach(route => {
      this.app.use('/', route.router);
    });
  }

  private initializeSwagger() {
    const options = {
      swaggerDefinition: {
        info: {
          title: 'REST API',
          version: '1.0.0',
          description: 'Example docs',
        },
      },
      apis: ['swagger.yaml'],
    };

    const specs = swaggerJSDoc(options);
    this.app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(specs));
  }

  private initializeErrorHandling() {
    this.app.use(errorMiddleware);
  }
}

export default App;
