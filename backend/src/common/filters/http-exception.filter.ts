import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
} from '@nestjs/common';
import type { Response } from 'express';
import { z } from 'zod';
import { ApiResponseDto } from '../dto/api-response.dto.js';
import { Prisma } from '../../generated/prisma/client.js';
const errorSchema = z.object({
  message: z.union([z.string(), z.array(z.string())]),
  error: z.string().optional(),
});
@Catch()
export class HttpExceptionFilter implements ExceptionFilter {
  catch(error: unknown, host: ArgumentsHost) {
    const response = host.switchToHttp().getResponse<Response>();
    let status = 500,
      message = 'Le serveur ne peut pas traiter cette demande.',
      errors: string[] | undefined;
    if (error instanceof HttpException) {
      status = error.getStatus();
      const detail = error.getResponse();
      if (typeof detail === 'string') message = detail;
      else {
        const parsed = errorSchema.safeParse(detail);
        if (parsed.success) {
          if (Array.isArray(parsed.data.message)) {
            errors = parsed.data.message;
            message = 'Vérifiez les informations saisies.';
          } else message = parsed.data.message;
        }
      }
    } else if (error instanceof Prisma.PrismaClientKnownRequestError) {
      if (error.code === 'P2002') {
        status = 409;
        message = 'Cette adresse e-mail ou ce nom de liste est déjà utilisé.';
      }
      if (error.code === 'P2025') {
        status = 404;
        message = 'Élément introuvable.';
      }
    }
    if (status === 500) console.error(error);
    response.status(status).json(ApiResponseDto.error(message, errors));
  }
}
