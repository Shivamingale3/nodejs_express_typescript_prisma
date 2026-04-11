import compression from 'compression';
import cookieParser from 'cookie-parser';
import cors from 'cors';
import express from 'express';
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
import prisma from '@databases/prisma';
import { checkStorageHealth } from '@databases/storage';
import { checkMailHealth } from '@databases/mail';
import { csrfMiddleware } from '@middlewares/csrf.middleware';

class App {
  public app: express.Application;
  public env: string;
  public port: string | number;

  constructor(routes: Routes[]) {
    this.app = express();
    this.env = NODE_ENV || 'development';
    this.port = PORT || 3000;

    this.connectToDatabase();
    this.connectToStorage();
    this.connectToMail();
    this.initializeMiddlewares();
    this.initializeRoutes(routes);
    this.initializeSwagger();
    this.initializeErrorHandling();
    this.initializeGracefulShutdown();
  }

  public listen() {
    this.app.listen(this.port, () => {
      logger.info(`=================================`);
      logger.info(`======= ENV: ${this.env} =======`);
      logger.info(`🚀 App listening on the port ${this.port}`);
      logger.info(`=================================`);
    });
  }

  private async connectToDatabase(): Promise<void> {
    try {
      await prisma.$connect();
      logger.info('✅ Database connected successfully');
    } catch (error) {
      logger.error('❌ Database connection failed', error);
      process.exit(1);
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
      try {
        await prisma.$disconnect();
        logger.info('✅ Database connection closed');
      } catch (error) {
        logger.error('❌ Error closing database connection', error);
      }
      process.exit(0);
    };

    process.on('SIGTERM', () => shutdown('SIGTERM'));
    process.on('SIGINT', () => shutdown('SIGINT'));
  }

  public getServer() {
    return this.app;
  }

  // private async connectToDatabase() {
  //   if (this.env !== 'production') {
  //     set('debug', true);
  //   }

  //   await connect(dbConnection.url);
  // }

  private initializeMiddlewares() {
    this.app.use(morgan(LOG_FORMAT ?? 'debug', { stream }));
    this.app.use(cors({ origin: parseOrigins(ORIGIN), credentials: CREDENTIALS }));
    this.app.use(hpp());
    this.app.use(helmet());
    this.app.use(compression());
    this.app.use(express.json());
    this.app.use(express.urlencoded({ extended: true }));
    this.app.use(cookieParser());
    this.app.use(csrfMiddleware);
  }

  private initializeRoutes(routes: Routes[]) {
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
