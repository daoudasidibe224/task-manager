import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy } from 'passport-jwt';
import type { Request } from 'express';
import { jwtPayloadSchema } from '../types/auth.js';
import { PrismaService } from '../../prisma.service.js';
import { UserResponseDto } from '../../user/dto/user-response.dto.js';
@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    config: ConfigService,
    private prisma: PrismaService,
  ) {
    super({
      jwtFromRequest: (req: Request) => {
        const token: unknown = req.cookies?.accessToken;
        return typeof token === 'string'
          ? token
          : req.headers.authorization?.startsWith('Bearer ')
            ? req.headers.authorization.slice(7)
            : null;
      },
      ignoreExpiration: false,
      algorithms: ['HS256'],
      secretOrKey: config.getOrThrow<string>('auth.jwtSecret'),
    });
  }
  async validate(value: unknown) {
    const result = jwtPayloadSchema.safeParse(value);
    if (!result.success) throw new UnauthorizedException('Session invalide.');
    const session = await this.prisma.session.findFirst({
      where: {
        id: result.data.sid,
        userId: result.data.sub,
        expiresAt: { gt: new Date() },
      },
      include: { user: true },
    });
    if (!session) throw new UnauthorizedException('Session expirée.');
    return { ...new UserResponseDto(session.user), sessionId: session.id };
  }
}
