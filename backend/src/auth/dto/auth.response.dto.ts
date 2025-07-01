import { ApiProperty } from '@nestjs/swagger';
import { UserResponseDto } from '../../user/dto/user-response.dto';

export class AuthResponseDto {
  @ApiProperty({
    description: "Token d'accès JWT",
    example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
  })
  accessToken: string;

  @ApiProperty({
    description: "Informations de l'utilisateur connecté",
    type: UserResponseDto,
  })
  user: UserResponseDto;

  @ApiProperty({
    description: 'Indique si la connexion est réussie',
    example: true,
  })
  success: boolean;

  @ApiProperty({
    description: 'Message de statut',
    example: 'Connexion réussie',
  })
  message: string;

  constructor(
    accessToken: string,
    user: UserResponseDto,
    message: string = 'Connexion réussie',
  ) {
    this.accessToken = accessToken;
    this.user = user;
    this.success = true;
    this.message = message;
  }
}

/**
 * DTO interne pour la gestion des tokens (ne pas exposer au frontend)
 * @internal
 */
export class InternalAuthResponseDto {
  accessToken: string;
  refreshToken: string;
  user: UserResponseDto;

  constructor(
    accessToken: string,
    refreshToken: string,
    user: UserResponseDto,
  ) {
    this.accessToken = accessToken;
    this.refreshToken = refreshToken;
    this.user = user;
  }
}
