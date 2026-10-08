import 'reflect-metadata';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import 'dotenv/config';
import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import cookieParser from 'cookie-parser';
import helmet from 'helmet';
import express from 'express';
import { readFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import type { NestExpressApplication } from '@nestjs/platform-express';
import type { Request, Response, NextFunction } from 'express';
import { AppModule } from './app.module.js';
import { runtimeConfiguration } from './config/runtime.js';
export async function createApplication() {
  const configuration = runtimeConfiguration();
  const directory = process.env.SERVE_FRONTEND_DIRECTORY
    ? path.resolve(process.env.SERVE_FRONTEND_DIRECTORY)
    : null;
  const hashes = directory
    ? [
        ...readFileSync(path.join(directory, 'index.html'), 'utf8').matchAll(
          /<script\b[^>]*>([\s\S]*?)<\/script>/gi,
        ),
      ]
        .filter((match) => match[1])
        .map(
          (match) =>
            `'sha256-${createHash('sha256').update(match[1]!).digest('base64')}'`,
        )
    : [];
  const app = await NestFactory.create<NestExpressApplication>(AppModule, {
    logger: ['error', 'warn'],
  });
  const frontend = configuration.FRONTEND_URL;
  app.set('trust proxy', configuration.TRUST_PROXY);
  app.setGlobalPrefix('api');
  app.use(
    helmet({
      contentSecurityPolicy: {
        directives: {
          scriptSrc: ["'self'", ...hashes],
          upgradeInsecureRequests:
            process.env.NODE_ENV === 'production' ? [] : null,
        },
      },
    }),
  );
  app.use(cookieParser());
  app.enableCors({ origin: frontend, credentials: true });
  app.use((req: Request, res: Response, next: NextFunction) => {
    if (
      !['GET', 'HEAD', 'OPTIONS'].includes(req.method) &&
      req.headers.origin &&
      req.headers.origin !== frontend
    ) {
      res
        .status(403)
        .json({ success: false, message: 'Origine non autorisée.' });
      return;
    }
    next();
  });
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: { enableImplicitConversion: false },
    }),
  );
  if (directory) {
    app.use(express.static(directory));
    app.use((req: Request, res: Response, next: NextFunction) => {
      if (
        !['GET', 'HEAD'].includes(req.method) ||
        req.path === '/api' ||
        req.path.startsWith('/api/')
      )
        return next();
      res.sendFile(path.join(directory, 'index.html'));
    });
  }
  const document = SwaggerModule.createDocument(
    app,
    new DocumentBuilder()
      .setTitle('Mes listes de tâches API')
      .setVersion('2.0')
      .addCookieAuth('accessToken')
      .build(),
  );
  if (process.env.NODE_ENV !== 'production')
    SwaggerModule.setup('api/docs', app, document);
  app.enableShutdownHooks();
  return app;
}
async function bootstrap() {
  const app = await createApplication();
  const configuration = runtimeConfiguration();
  const port = configuration.PORT;
  await app.listen(port, configuration.HOST);
  console.log(`Mes listes de tâches API écoute sur ${port}`);
}
if (
  process.argv[1] &&
  path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)
)
  bootstrap().catch((error: unknown) => {
    console.error(error);
    process.exitCode = 1;
  });
