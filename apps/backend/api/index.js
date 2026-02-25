const { NestFactory } = require('@nestjs/core');
const { ExpressAdapter } = require('@nestjs/platform-express');
const { ValidationPipe } = require('@nestjs/common');
const express = require('express');
const cookieParser = require('cookie-parser');
const { AppModule } = require('../dist/app.module');

const server = express();
let cachedApp = null;

async function bootstrapServer() {
  if (!cachedApp) {
    const app = await NestFactory.create(
      AppModule,
      new ExpressAdapter(server),
      { logger: ['error', 'warn', 'log'] },
    );

    app.use(cookieParser());

    app.useBodyParser('json', {
      type: ['application/json', 'application/scim+json', 'application/*+json'],
    });

    app.setGlobalPrefix(process.env.API_PREFIX || 'api/v1', {
      exclude: [
        { path: 'scim/v2/:orgRef', method: 6 },
        { path: 'scim/v2/:orgRef/(.*)', method: 6 },
        { path: '.well-known/(.*)', method: 6 },
        { path: 'oauth', method: 6 },
        { path: 'oauth/(.*)', method: 6 },
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

module.exports = async (req, res) => {
  await bootstrapServer();
  server(req, res);
};
