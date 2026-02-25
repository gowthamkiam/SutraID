import { NestFactory } from '@nestjs/core';
import { ExpressAdapter } from '@nestjs/platform-express';
import { RequestMethod, ValidationPipe, INestApplication } from '@nestjs/common';
import express, { Request, Response } from 'express';
import cookieParser from 'cookie-parser';
import { AppModule } from '../src/app.module';

const server = express();
let cachedApp: INestApplication | null = null;

async function bootstrapServer() {
  if (!cachedApp) {
    const app = await NestFactory.create(
      AppModule,
      new ExpressAdapter(server),
      { logger: ['error', 'warn', 'log'] }
    );

    app.use(cookieParser());

    (app as any).useBodyParser('json', {
      type: ['application/json', 'application/scim+json', 'application/*+json'],
    });

    app.setGlobalPrefix(process.env.API_PREFIX || 'api/v1', {
      exclude: [
        { path: 'scim/v2/:orgRef', method: RequestMethod.ALL },
        { path: 'scim/v2/:orgRef/(.*)', method: RequestMethod.ALL },
        { path: '.well-known/(.*)', method: RequestMethod.ALL },
        { path: 'oauth', method: RequestMethod.ALL },
        { path: 'oauth/(.*)', method: RequestMethod.ALL },
      ],
    });

    const allowedOrigins = (process.env.FRONTEND_URL || 'http://localhost:3001')
      .split(',')
      .map((url) => url.trim().replace(/\/+$/, ''));

    app.enableCors({
      origin: allowedOrigins,
      credentials: true,
      methods: ['GET', 'HEAD', 'PUT', 'PATCH', 'POST', 'DELETE', 'OPTIONS'],
      allowedHeaders: ['Content-Type', 'Authorization', 'Accept', 'X-Requested-With'],
      exposedHeaders: ['Content-Range', 'X-Content-Range'],
      maxAge: 3600,
    });

    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
      }),
    );

    await app.init();
    cachedApp = app;
  }
  return cachedApp;
}

export default async (req: Request, res: Response) => {
  await bootstrapServer();
  server(req, res);
};
