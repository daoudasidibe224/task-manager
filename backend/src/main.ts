import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { SwaggerModule } from '@nestjs/swagger';
import { ValidationPipe } from '@nestjs/common';
import cookieParser from 'cookie-parser';
import * as dotenv from 'dotenv';
import {
  appConfig,
  corsConfig,
  createSwaggerConfig,
  validationConfig,
} from './config';

dotenv.config();

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Configuration du préfixe global
  app.setGlobalPrefix(appConfig.globalPrefix);

  // Configuration des cookies
  app.use(cookieParser());

  // Configuration CORS
  app.enableCors(corsConfig);

  // Configuration de la validation globale DTO
  app.useGlobalPipes(new ValidationPipe(validationConfig));

  // Configuration Swagger
  const swaggerConfig = createSwaggerConfig();
  const document = SwaggerModule.createDocument(app, swaggerConfig);
  SwaggerModule.setup('api', app, document);

  // Démarrage du serveur avec host et port configurés pour Docker
  await app.listen(appConfig.port, appConfig.host);

  // Messages de démarrage
  console.log(`🚀 Server is running on ${appConfig.host}:${appConfig.port}`);
  console.log(
    `📚 Swagger documentation available at http://${appConfig.host}:${appConfig.port}/api`,
  );
}
void bootstrap();
