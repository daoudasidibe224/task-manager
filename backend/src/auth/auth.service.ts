import {
  Injectable,
  UnauthorizedException,
  BadRequestException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { UserService } from '../user/user.service';
import { LoginDto } from './dto/login.dto';
import { UserResponseDto } from '../user/dto/user-response.dto';
import { CreateUserDto } from '../user/dto/create-user.dto';
import { JwtPayload } from './types/auth';
import { AuthTokens } from './interceptors/auth-cookie.interceptor';
import { ApiResponseDto } from '../common/dto/api-response.dto';

@Injectable()
export class AuthService {
  constructor(
    private userService: UserService,
    private jwtService: JwtService,
    private configService: ConfigService,
  ) {}

  /**
   * Génère les tokens d'authentification
   */
  private generateTokens(user: { email: string; id: string }): AuthTokens {
    const payload: JwtPayload = {
      email: user.email,
      sub: user.id,
    };

    const accessToken = this.jwtService.sign(payload);
    const refreshToken = this.jwtService.sign(payload, {
      secret: this.configService.get<string>('auth.refreshTokenSecret'),
      expiresIn: this.configService.get<string>('auth.refreshTokenExpiresIn'),
    });

    return { accessToken, refreshToken };
  }

  async validateUser(
    email: string,
    password: string,
  ): Promise<Omit<UserResponseDto, 'password'> | null> {
    const user = await this.userService.findByEmailWithPassword(email);
    if (user && (await bcrypt.compare(password, user.password))) {
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { password, ...result } = user;
      return result as Omit<UserResponseDto, 'password'>;
    }
    return null;
  }

  async login(loginDto: LoginDto): Promise<ApiResponseDto> {
    const user = await this.validateUser(loginDto.email, loginDto.password);
    if (!user) {
      throw new UnauthorizedException('Email ou mot de passe incorrect');
    }

    const typedUser = user as { email: string; id: string };
    const tokens = this.generateTokens(typedUser);

    // Stocker le refresh token hashé en base
    await this.userService.updateRefreshToken(
      typedUser.id,
      tokens.refreshToken,
    );

    const userResponse = new UserResponseDto(typedUser);
    return ApiResponseDto.success('Connexion réussie', {
      user: userResponse,
      tokens,
    });
  }

  async register(createUserDto: CreateUserDto): Promise<ApiResponseDto> {
    const user = await this.userService.create(createUserDto);
    return ApiResponseDto.success(
      'Inscription réussie. Vous pouvez maintenant vous connecter.',
      { user },
    );
  }

  async refreshTokens(refreshToken: string): Promise<ApiResponseDto> {
    try {
      const payload = this.jwtService.verify<JwtPayload>(refreshToken, {
        secret: this.configService.get<string>('auth.refreshTokenSecret'),
      });

      const user = await this.userService.findByEmailWithPassword(
        payload.email,
      );
      if (!user || !user.refreshToken) {
        throw new UnauthorizedException('Token de rafraîchissement invalide');
      }

      const isRefreshTokenValid = await bcrypt.compare(
        refreshToken,
        user.refreshToken,
      );
      if (!isRefreshTokenValid) {
        throw new UnauthorizedException('Token de rafraîchissement invalide');
      }

      const newTokens = this.generateTokens(user);

      // Mettre à jour le refresh token en base
      await this.userService.updateRefreshToken(
        user.id,
        newTokens.refreshToken,
      );

      const userResponse = new UserResponseDto(user);
      return ApiResponseDto.success('Tokens rafraîchis', {
        user: userResponse,
        tokens: newTokens,
      });
    } catch {
      throw new BadRequestException('Token de rafraîchissement invalide');
    }
  }

  async logout(userId: string): Promise<ApiResponseDto> {
    // Invalider le refresh token en le supprimant de la base de données
    await this.userService.invalidateRefreshToken(userId);

    return ApiResponseDto.success('Déconnexion réussie', {
      clearCookies: true,
    });
  }

  async getProfile(userId: string): Promise<ApiResponseDto> {
    const user = await this.userService.findOne(userId);
    return ApiResponseDto.success('Profil récupéré avec succès', {
      user,
    });
  }
}
