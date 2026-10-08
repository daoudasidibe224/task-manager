import 'reflect-metadata';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import 'dotenv/config';
import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import cookieParser from 'cookie-parser';
import helmet from 'helmet';
import type { Request, Response, NextFunction } from 'express';
import { AppModule } from './app.module.js';
export async function createApplication() {
  const app = await NestFactory.create(AppModule, {
    logger: ['error', 'warn'],
  });
  const frontend = process.env.FRONTEND_URL || 'http://127.0.0.1:4312';
  app.setGlobalPrefix('api');
  app.use(helmet());
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
  const document = SwaggerModule.createDocument(
    app,
    new DocumentBuilder()
      .setTitle('Mes listes de tâches API')
      .setVersion('2.0')
      .addCookieAuth('accessToken')
      .build(),
  );
  SwaggerModule.setup('api/docs', app, document);
  app.enableShutdownHooks();
  return app;
}
async function bootstrap() {
  const app = await createApplication();
  const port = Number(process.env.PORT || 8012);
  await app.listen(port, process.env.HOST || '127.0.0.1');
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
