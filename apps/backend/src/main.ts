import { NestFactory } from '@nestjs/core';
import { RequestMethod, ValidationPipe } from '@nestjs/common';
import * as cookieParser from 'cookie-parser';
import helmet from 'helmet';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Security headers (Helmet.js)
  app.use(helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        styleSrc: ["'self'", "'unsafe-inline'"], // Allow inline styles for QR codes
        scriptSrc: ["'self'"],
        imgSrc: ["'self'", "data:", "https:"], // Allow data URLs for QR codes
        connectSrc: ["'self'"],
        fontSrc: ["'self'"],
        objectSrc: ["'none'"],
        mediaSrc: ["'self'"],
        frameSrc: ["'none'"],
      },
    },
    hsts: {
      maxAge: 31536000,
      includeSubDomains: true,
      preload: true,
    },
    frameguard: {
      action: 'deny',
    },
    noSniff: true,
    xssFilter: true,
    referrerPolicy: { policy: 'strict-origin-when-cross-origin' },
  }));

  app.use(cookieParser());

  // Accept SCIM media type payloads in addition to standard JSON.
  // Use Nest's platform body parser to avoid direct runtime dependency imports.
  (app as any).useBodyParser('json', {
    type: ['application/json', 'application/scim+json', 'application/*+json'],
  });

  // Global prefix for all routes
  app.setGlobalPrefix(process.env.API_PREFIX || 'api/v1', {
    exclude: [
      { path: 'scim/v2', method: RequestMethod.ALL },
      { path: 'scim/v2/(.*)', method: RequestMethod.ALL },
      { path: '.well-known/(.*)', method: RequestMethod.ALL },
      { path: 'oauth', method: RequestMethod.ALL },
      { path: 'oauth/(.*)', method: RequestMethod.ALL },
      { path: 'saml/:appId/metadata.xml', method: RequestMethod.GET },
      { path: 'saml/:appId/sso', method: RequestMethod.POST },
      { path: 'guide/:appId', method: RequestMethod.GET },
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
