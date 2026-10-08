import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from '@nestjs/common';
import type { Response, CookieOptions } from 'express';
import { Observable, map } from 'rxjs';
import { z } from 'zod';
const envelope = z.object({
  success: z.boolean(),
  message: z.string(),
  timestamp: z.date(),
  data: z.object({
    user: z.unknown().optional(),
    tokens: z
      .object({ accessToken: z.string(), refreshToken: z.string() })
      .optional(),
    clearCookies: z.boolean().optional(),
  }),
});
@Injectable()
export class AuthCookieInterceptor implements NestInterceptor {
  intercept(
    context: ExecutionContext,
    next: CallHandler<unknown>,
  ): Observable<unknown> {
    return next.handle().pipe(
      map((value: unknown) => {
        const result = envelope.parse(value);
        const response = context.switchToHttp().getResponse<Response>();
        const options: CookieOptions = {
          httpOnly: true,
          secure: process.env.NODE_ENV === 'production',
          sameSite: 'lax',
          path: '/',
        };
        if (result.data.tokens) {
          response.cookie('accessToken', result.data.tokens.accessToken, {
            ...options,
            maxAge: 900000,
          });
          response.cookie('refreshToken', result.data.tokens.refreshToken, {
            ...options,
            maxAge: 604800000,
          });
        }
        if (result.data.clearCookies) {
          response.clearCookie('accessToken', options);
          response.clearCookie('refreshToken', options);
        }
        return { ...result, data: { user: result.data.user } };
      }),
    );
  }
}
