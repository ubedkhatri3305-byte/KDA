import { NestFactory } from '@nestjs/core';
import { ValidationPipe, Logger } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { ConfigService } from '@nestjs/config';
import helmet from 'helmet';
import compression from 'compression';
import { AppModule } from './app.module';
import { HttpExceptionFilter } from './common/filters/http-exception.filter';
import { TransformInterceptor } from './common/interceptors/transform.interceptor';
import { LoggingInterceptor } from './common/interceptors/logging.interceptor';

async function bootstrap() {
  const logger = new Logger('Bootstrap');
  const app = await NestFactory.create(AppModule, {
    logger: ['log', 'error', 'warn', 'debug', 'verbose'],
  });

  const configService = app.get(ConfigService);
  const port = process.env.PORT
    ? parseInt(process.env.PORT, 10)
    : configService.get<number>('PORT', 5000);
  const nodeEnv = configService.get<string>('NODE_ENV', 'development');
  const rawAllowedOrigins =
    configService.get<string>('ALLOWED_ORIGINS', '') || '';
  const allowedOrigins = rawAllowedOrigins
    .split(',')
    .map((o) => o.trim())
    .filter(Boolean);

  // ─── Security Headers ────────────────────────────────────────
  app.use(
    helmet({
      crossOriginEmbedderPolicy: false,
      crossOriginResourcePolicy: false,
      contentSecurityPolicy: {
        directives: {
          defaultSrc: ["'self'"],
          imgSrc: ["'self'", 'data:', 'https://res.cloudinary.com'],
          scriptSrc: ["'self'"],
          styleSrc: ["'self'", "'unsafe-inline'"],
        },
      },
    }),
  );

  // ─── CORS ────────────────────────────────────────────────────
  app.enableCors({
    origin: (origin, callback) => {
      if (nodeEnv !== 'production' || !origin) {
        callback(null, true);
      } else if (
        allowedOrigins.includes(origin) ||
        allowedOrigins.includes('*') ||
        origin.endsWith('.vercel.app') ||
        origin.includes('vercel.app') ||
        allowedOrigins.length === 0
      ) {
        callback(null, true);
      } else {
        logger.log(`Permitting origin: ${origin}`);
        callback(null, true);
      }
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: [
      'Content-Type',
      'Authorization',
      'X-Requested-With',
      'X-CSRF-Token',
    ],
  });

  // ─── Compression ─────────────────────────────────────────────
  app.use(compression());

  // ─── Global Prefix ───────────────────────────────────────────
  app.setGlobalPrefix('api/v1', {
    exclude: ['/', 'health'],
  });

  // ─── Global Pipes ────────────────────────────────────────────
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: false,
      transform: true,
      transformOptions: { enableImplicitConversion: true },
    }),
  );

  // ─── Global Filters & Interceptors ───────────────────────────
  app.useGlobalFilters(new HttpExceptionFilter());
  app.useGlobalInterceptors(
    new TransformInterceptor(),
    new LoggingInterceptor(),
  );

  // ─── Swagger Documentation ───────────────────────────────────
  if (nodeEnv !== 'production') {
    const config = new DocumentBuilder()
      .setTitle('K D A API')
      .setDescription('K D A Clothing E-Commerce Platform API')
      .setVersion('1.0')
      .addBearerAuth()
      .addTag('Auth', 'Authentication endpoints')
      .addTag('Users', 'User management')
      .addTag('Products', 'Product management')
      .addTag('Categories', 'Category management')
      .addTag('Orders', 'Order management')
      .addTag('Cart', 'Shopping cart')
      .addTag('Wishlist', 'Product wishlist')
      .addTag('Payments', 'Payment processing')
      .addTag('AI', 'AI-powered features')
      .addTag('Admin', 'Admin dashboard')
      .build();

    const document = SwaggerModule.createDocument(app, config);
    SwaggerModule.setup('api/docs', app, document, {
      swaggerOptions: { persistAuthorization: true },
    });
    logger.log(`Swagger docs at http://localhost:${port}/api/docs`);
  }

  await app.listen(port, '0.0.0.0');
  logger.log(`🚀 K D A API running on port ${port} in ${nodeEnv} mode`);
}

bootstrap().catch((err) => {
  console.error('❌ Application startup failed:', err);
  process.exit(1);
});
