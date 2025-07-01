import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { ApiResponseDto } from '../../common/dto/api-response.dto';

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
}

export interface AuthResponse {
  tokens?: AuthTokens;
  clearCookies?: boolean;
  [key: string]: any;
}

// Interface pour les cookies compatible avec différentes plateformes HTTP
interface CookieOptions {
  httpOnly?: boolean;
  secure?: boolean;
  sameSite?: 'strict' | 'lax' | 'none';
  maxAge?: number;
  path?: string;
}

interface PlatformResponse {
  cookie(name: string, value: string, options?: CookieOptions): void;
  clearCookie(
    name: string,
    options?: Pick<CookieOptions, 'httpOnly' | 'path'>,
  ): void;
}

type Payload = {
  tokens?: AuthTokens;
  clearCookies?: boolean;
  [key: string]: unknown;
};

@Injectable()
export class AuthCookieInterceptor implements NestInterceptor {
  constructor(private configService: ConfigService) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    return next.handle().pipe(
      map((data: ApiResponseDto<Payload>) => {
        const response = context.switchToHttp().getResponse<PlatformResponse>();

        if (!data?.data) {
          return data;
        }

        const { tokens, clearCookies, ...restPayload } = data.data;

        if (tokens) {
          this.setAuthCookies(response, tokens);
        }

        if (clearCookies) {
          this.clearAuthCookies(response);
        }

        return { ...data, data: restPayload };
      }),
    );
  }

  private setAuthCookies(response: PlatformResponse, tokens: AuthTokens): void {
    const isProduction = process.env.NODE_ENV === 'production';

    const cookieOptions: CookieOptions = {
      httpOnly: true, // Protection XSS
      secure: isProduction, // HTTPS en production
      sameSite: isProduction ? 'strict' : 'lax',
      path: '/',
    };

    response.cookie('accessToken', tokens.accessToken, {
      ...cookieOptions,
      maxAge: 15 * 60 * 1000, // 15 minutes
    });

    // Cookie pour le refresh token (7 jours)
    response.cookie('refreshToken', tokens.refreshToken, {
      ...cookieOptions,
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 jours
    });
  }

  private clearAuthCookies(response: PlatformResponse): void {
    const clearOptions = {
      httpOnly: true,
      path: '/',
    };

    response.clearCookie('accessToken', clearOptions);
    response.clearCookie('refreshToken', clearOptions);
  }
}
