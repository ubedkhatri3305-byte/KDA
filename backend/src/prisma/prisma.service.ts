import {
  Injectable,
  OnModuleInit,
  OnModuleDestroy,
  Logger,
} from '@nestjs/common';
import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';

@Injectable()
export class PrismaService
  extends PrismaClient
  implements OnModuleInit, OnModuleDestroy
{
  private readonly logger = new Logger(PrismaService.name);

  constructor() {
    const accelerateUrl =
      process.env.ACCELERATE_URL || process.env.PRISMA_ACCELERATE_URL;

    const connectionString = process.env.DATABASE_URL;
    const pool = new Pool({
      connectionString,
      // Neon scale-to-zero: allow up to 30s for cold start wakeup
      connectionTimeoutMillis: 30000,
      // Release idle connections quickly (serverless friendly)
      idleTimeoutMillis: 10000,
      max: 5,
    });
    const adapter = new PrismaPg(pool);

    super({
      log: [
        { emit: 'stdout', level: 'info' },
        { emit: 'stdout', level: 'warn' },
        { emit: 'stdout', level: 'error' },
      ],
      errorFormat: 'colorless',
      adapter,
      ...(accelerateUrl ? { accelerateUrl } : {}),
    });
  }

  async onModuleInit() {
    await this.$connect();
    this.logger.log('✅ Database connected successfully');

    // Log slow queries in development
    if (process.env.NODE_ENV === 'development') {
      (this.$on as any)('query', (event: any) => {
        if (event.duration > 2000) {
          this.logger.warn(
            `⚠️ Slow query (${event.duration}ms): ${event.query}`,
          );
        }
      });
    }
  }

  async onModuleDestroy() {
    await this.$disconnect();
    this.logger.log('Database disconnected');
  }

  async cleanDatabase() {
    if (process.env.NODE_ENV === 'production') {
      throw new Error('Cannot clean database in production');
    }
    const models = Reflect.ownKeys(this).filter((key) => key[0] !== '_');
    return Promise.all(
      models.map((modelKey) => (this as any)[modelKey].deleteMany()),
    );
  }
}
