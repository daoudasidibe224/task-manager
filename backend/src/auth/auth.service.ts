import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import bcrypt from 'bcrypt';
import { createHash, randomUUID, timingSafeEqual } from 'node:crypto';
import { UserService } from '../user/user.service.js';
import { PrismaService } from '../prisma.service.js';
import { LoginDto } from './dto/login.dto.js';
import { CreateUserDto } from '../user/dto/create-user.dto.js';
import { UserResponseDto } from '../user/dto/user-response.dto.js';
import {
  jwtPayloadSchema,
  type JwtPayload,
  type AuthTokens,
} from './types/auth.js';
import { ApiResponseDto } from '../common/dto/api-response.dto.js';
const digest = (value: string) =>
  createHash('sha256').update(value).digest('hex');
@Injectable()
export class AuthService {
  constructor(
    private users: UserService,
    private prisma: PrismaService,
    private jwt: JwtService,
    private config: ConfigService,
  ) {}
  private tokens(payload: JwtPayload): AuthTokens {
    return {
      accessToken: this.jwt.sign(payload, {
        expiresIn: 900,
        algorithm: 'HS256',
      }),
      refreshToken: this.jwt.sign(payload, {
        secret: this.config.getOrThrow<string>('auth.refreshTokenSecret'),
        expiresIn: 604800,
        algorithm: 'HS256',
        jwtid: randomUUID(),
      }),
    };
  }
  async login(credentials: LoginDto) {
    const user = await this.users.findByEmailWithPassword(credentials.email);
    if (!user || !(await bcrypt.compare(credentials.password, user.password)))
      throw new UnauthorizedException(
        'Adresse e-mail ou mot de passe incorrect.',
      );
    const sessionId = randomUUID();
    const tokens = this.tokens({
      sub: user.id,
      email: user.email,
      sid: sessionId,
    });
    await this.prisma.session.create({
      data: {
        id: sessionId,
        userId: user.id,
        refreshHash: digest(tokens.refreshToken),
        expiresAt: new Date(Date.now() + 604800000),
      },
    });
    return ApiResponseDto.success('Connexion réussie', {
      user: new UserResponseDto(user),
      tokens,
    });
  }
  async register(data: CreateUserDto) {
    return ApiResponseDto.success(
      'Votre compte est créé. Vous pouvez vous connecter.',
      { user: await this.users.create(data) },
    );
  }
  async refreshTokens(token: string) {
    let payload: JwtPayload;
    try {
      payload = jwtPayloadSchema.parse(
        this.jwt.verify<Record<string, unknown>>(token, {
          secret: this.config.getOrThrow<string>('auth.refreshTokenSecret'),
          algorithms: ['HS256'],
        }),
      );
    } catch {
      throw new UnauthorizedException(
        'Session expirée. Connectez-vous à nouveau.',
      );
    }
    const session = await this.prisma.session.findUnique({
      where: { id: payload.sid },
      include: { user: true },
    });
    const hash = digest(token);
    if (
      !session ||
      session.userId !== payload.sub ||
      session.expiresAt.getTime() < Date.now() ||
      session.refreshHash.length !== hash.length ||
      !timingSafeEqual(Buffer.from(session.refreshHash), Buffer.from(hash))
    )
      throw new UnauthorizedException(
        'Session expirée. Connectez-vous à nouveau.',
      );
    const tokens = this.tokens(payload);
    const update = await this.prisma.session.updateMany({
      where: { id: session.id, refreshHash: hash },
      data: {
        refreshHash: digest(tokens.refreshToken),
        expiresAt: new Date(Date.now() + 604800000),
      },
    });
    if (update.count !== 1)
      throw new UnauthorizedException('Ce jeton a déjà été utilisé.');
    return ApiResponseDto.success('Session renouvelée', {
      user: new UserResponseDto(session.user),
      tokens,
    });
  }
  async logout(userId: string, sessionId: string) {
    await this.prisma.session.deleteMany({ where: { id: sessionId, userId } });
    return ApiResponseDto.success('Déconnexion réussie', {
      clearCookies: true,
    });
  }
  async getProfile(userId: string) {
    return ApiResponseDto.success('Profil', {
      user: await this.users.findOne(userId),
    });
  }
}
