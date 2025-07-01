import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy } from 'passport-jwt';
import { UserService } from '../../user/user.service';
import { JwtPayload } from '../types/auth';

// Interface pour extraire les cookies
interface RequestWithCookies {
  cookies?: {
    accessToken?: string;
  };
  headers?: {
    authorization?: string;
  };
}

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    private configService: ConfigService,
    private userService: UserService,
  ) {
    super({
      // cookies en priorité, puis Authorization header
      jwtFromRequest: (req: RequestWithCookies) => {
        if (req.cookies?.accessToken) {
          return req.cookies.accessToken;
        }

        const authHeader = req.headers?.authorization;
        if (authHeader?.startsWith('Bearer ')) {
          return authHeader.substring(7);
        }

        return null;
      },
      ignoreExpiration: false,
      secretOrKey:
        configService.get<string>('auth.jwtSecret') || 'fallback-secret',
    });
  }

  async validate(payload: JwtPayload) {
    return this.userService.findOne(payload.sub);
  }
}
