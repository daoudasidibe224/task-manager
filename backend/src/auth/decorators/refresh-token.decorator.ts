import {
  createParamDecorator,
  ExecutionContext,
  BadRequestException,
} from '@nestjs/common';

interface RequestWithCookies {
  cookies?: {
    refreshToken?: string;
  };
}

export const RefreshToken = createParamDecorator(
  (data: unknown, ctx: ExecutionContext): string => {
    const request = ctx.switchToHttp().getRequest<RequestWithCookies>();
    const refreshToken = request.cookies?.refreshToken;

    if (!refreshToken) {
      throw new BadRequestException('Token de rafraîchissement manquant');
    }

    return refreshToken;
  },
);
