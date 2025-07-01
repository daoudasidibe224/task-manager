import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
} from '@nestjs/common';
import { ApiResponseDto } from '../dto/api-response.dto';

interface ResponseWithStatus {
  status(statusCode: number): ResponseWithStatus;
  json(body: any): void;
}

@Catch(HttpException)
export class HttpExceptionFilter implements ExceptionFilter {
  catch(exception: HttpException, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<ResponseWithStatus>();
    const status = exception.getStatus();
    const exceptionResponse = exception.getResponse();

    let message: string;
    let errors: string[] | undefined;

    if (typeof exceptionResponse === 'string') {
      message = exceptionResponse;
    } else if (
      typeof exceptionResponse === 'object' &&
      exceptionResponse !== null
    ) {
      const res = exceptionResponse as {
        message: string | string[];
        error?: string;
      };
      if (Array.isArray(res.message)) {
        message = res.error || 'Validation failed';
        errors = res.message;
      } else {
        message = res.message;
      }
    } else {
      message = 'Internal server error';
    }

    response.status(status).json(ApiResponseDto.error(message, errors));
  }
}
