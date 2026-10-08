import {
  createParamDecorator,
  ExecutionContext,
  UnauthorizedException,
} from '@nestjs/common';

interface RequestWithCookies {
  cookies?: {
    refreshToken?: unknown;
  };
}

export const RefreshToken = createParamDecorator(
  (data: unknown, ctx: ExecutionContext): string => {
    const request = ctx.switchToHttp().getRequest<RequestWithCookies>();
    const refreshToken = request.cookies?.refreshToken;

    if (typeof refreshToken !== 'string' || !refreshToken) {
      throw new UnauthorizedException(
        'Connectez-vous pour accéder à votre compte.',
      );
    }

    return refreshToken;
  },
);
