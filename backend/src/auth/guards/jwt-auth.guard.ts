import { Injectable, ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { AuthGuard } from '@nestjs/passport';

@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {
  constructor(private reflector: Reflector) {
    super();
  }

  canActivate(context: ExecutionContext) {
    const isPublic = this.reflector.getAllAndOverride<boolean>('isPublic', [
      context.getHandler(),
      context.getClass(),
    ]);

    if (isPublic) {
      return true;
    }

    // Bypass pour Swagger UI - Activé avec SWAGGER_AUTH_BYPASS=true
    if (process.env.SWAGGER_AUTH_BYPASS === 'true') {
      console.log('🔓 SWAGGER AUTH BYPASS - Tests et documentation uniquement');
      return true;
    }

    return super.canActivate(context);
  }
}
