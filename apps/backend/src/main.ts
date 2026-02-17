import { NestFactory } from '@nestjs/core';
import { RequestMethod, ValidationPipe } from '@nestjs/common';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Accept SCIM media type payloads in addition to standard JSON.
  // Use Nest's platform body parser to avoid direct runtime dependency imports.
  (app as any).useBodyParser('json', {
    type: ['application/json', 'application/scim+json', 'application/*+json'],
  });

  // Global prefix for all routes
  app.setGlobalPrefix(process.env.API_PREFIX || 'api/v1', {
    exclude: [
      { path: 'scim/v2/:orgRef', method: RequestMethod.ALL },
      { path: 'scim/v2/:orgRef/(.*)', method: RequestMethod.ALL },
    ],
  });

  // Enable CORS
  const allowedOrigins = (process.env.FRONTEND_URL || 'http://localhost:3001')
    .split(',')
    .map((url) => url.trim().replace(/\/+$/, ''));
  console.log('🔒 CORS allowed origins:', allowedOrigins);
  app.enableCors({
    origin: allowedOrigins,
    credentials: true,
    methods: ['GET', 'HEAD', 'PUT', 'PATCH', 'POST', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'Accept', 'X-Requested-With'],
    exposedHeaders: ['Content-Range', 'X-Content-Range'],
    maxAge: 3600,
  });

  // Global validation pipe
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  const port = process.env.PORT || 3000;
  await app.listen(port);

  console.log(`🚀 SutraID Backend running on: http://localhost:${port}`);
  console.log(`📡 API endpoint: http://localhost:${port}/${process.env.API_PREFIX || 'api/v1'}`);
}

bootstrap();
