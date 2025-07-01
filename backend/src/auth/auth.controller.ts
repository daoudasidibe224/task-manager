import {
  Controller,
  Get,
  Post,
  Body,
  UseGuards,
  HttpCode,
  HttpStatus,
  UseInterceptors,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiCookieAuth,
} from '@nestjs/swagger';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { Public } from './decorators/public.decorator';
import { CurrentUser } from './decorators/current-user.decorator';
import { AuthenticatedUser } from './types/auth';
import { AuthCookieInterceptor } from './interceptors/auth-cookie.interceptor';
import { RefreshToken } from './decorators/refresh-token.decorator';

@ApiTags('Authentication')
@ApiBearerAuth('JWT-auth')
@ApiCookieAuth('JWT-cookie')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Public()
  @Post('register')
  @ApiOperation({ summary: "Inscription d'un nouvel utilisateur" })
  @ApiResponse({
    status: 201,
    description:
      'Utilisateur créé avec succès. Utilisez /auth/login pour vous connecter.',
  })
  @ApiResponse({ status: 409, description: 'Email déjà utilisé' })
  async register(@Body() registerDto: RegisterDto) {
    return this.authService.register(registerDto);
  }

  @Public()
  @Post('login')
  @UseInterceptors(AuthCookieInterceptor)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: "Connexion d'un utilisateur" })
  @ApiResponse({
    status: 200,
    description: 'Connexion réussie, cookies définis automatiquement',
  })
  @ApiResponse({ status: 401, description: 'Identifiants invalides' })
  async login(@Body() loginDto: LoginDto) {
    return this.authService.login(loginDto);
  }

  @Public()
  @Post('refresh')
  @UseInterceptors(AuthCookieInterceptor)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: "Rafraîchir les tokens d'authentification" })
  @ApiResponse({
    status: 200,
    description: 'Tokens rafraîchis avec succès',
  })
  @ApiResponse({
    status: 400,
    description: 'Token de rafraîchissement invalide',
  })
  async refreshTokens(@RefreshToken() refreshToken: string) {
    return this.authService.refreshTokens(refreshToken);
  }

  @UseGuards(JwtAuthGuard)
  @Post('logout')
  @UseInterceptors(AuthCookieInterceptor)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: "Déconnexion d'un utilisateur" })
  @ApiResponse({
    status: 200,
    description: 'Déconnexion réussie, cookies supprimés automatiquement',
  })
  @ApiResponse({ status: 401, description: 'Token invalide' })
  async logout(@CurrentUser() user: AuthenticatedUser) {
    return this.authService.logout(user.id);
  }

  @UseGuards(JwtAuthGuard)
  @Get('profile')
  @ApiOperation({ summary: "Récupérer le profil de l'utilisateur connecté" })
  @ApiResponse({
    status: 200,
    description: 'Profil utilisateur récupéré avec succès',
  })
  @ApiResponse({ status: 401, description: 'Token invalide' })
  async getProfile(@CurrentUser() user: AuthenticatedUser) {
    return this.authService.getProfile(user.id);
  }
}
