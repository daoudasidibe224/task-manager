import { ValidationPipeOptions } from '@nestjs/common';
import { CorsOptions } from '@nestjs/common/interfaces/external/cors-options.interface';
import { DocumentBuilder } from '@nestjs/swagger';
import { HelmetOptions } from 'helmet';

// Configuration Helmet pour la sécurité
export const helmetConfig: HelmetOptions = {
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'", "'unsafe-inline'", "'unsafe-eval'"],
      imgSrc: ["'self'", 'data:', 'https:'],
    },
  },
  crossOriginEmbedderPolicy: false,
};

// Configuration CORS avec support Docker ET développement local
export const corsConfig: CorsOptions = {
  origin: [
    process.env.FRONTEND_URL || 'http://localhost:8000',
    'http://localhost:8000', // Frontend local
    'http://localhost:3000', // API local
    'http://frontend:8000', // Frontend Docker
    'http://backend:3000', // API Docker
  ],
  credentials: true, // Essentiel pour les cookies
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: [
    'Origin',
    'X-Requested-With',
    'Content-Type',
    'Accept',
    'Authorization',
    'X-CSRF-Token',
  ],
};

// Configuration ValidationPipe
export const validationConfig: ValidationPipeOptions = {
  whitelist: true, // Supprime les propriétés non définies dans les DTOs
  forbidNonWhitelisted: true, // Lève une erreur si des propriétés non autorisées sont présentes
  transform: true, // Transforme automatiquement les types
  transformOptions: {
    enableImplicitConversion: true, // Conversion automatique des types
  },
};

// Configuration Swagger
export const createSwaggerConfig = () => {
  return new DocumentBuilder()
    .setTitle('Task Manager API')
    .setVersion('1.0')
    .setDescription('API pour la gestion des tâches')
    .build();
};

// Configuration générale de l'application avec support Docker
export const appConfig = {
  globalPrefix: 'api',
  port: process.env.PORT ?? 30000,
  host: process.env.HOST ?? '0.0.0.0',
};
