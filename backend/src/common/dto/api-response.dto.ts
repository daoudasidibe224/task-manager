import { ApiProperty } from '@nestjs/swagger';

export class ApiResponseDto<T = any> {
  @ApiProperty({
    description: 'Indique si la requête a réussi',
    example: true,
  })
  success: boolean;

  @ApiProperty({
    description: 'Message descriptif de la réponse',
    example: 'Utilisateur créé avec succès',
  })
  message: string;

  @ApiProperty({
    description: 'Données de la réponse (optionnel)',
    required: false,
  })
  data?: T;

  @ApiProperty({
    description: "Liste des erreurs (en cas d'échec)",
    example: ['Le prénom est requis', "L'email doit être valide"],
    required: false,
    type: [String],
  })
  errors?: string[];

  @ApiProperty({
    description: 'Horodatage de la réponse',
    example: '2025-06-28T10:30:00.000Z',
    type: Date,
  })
  timestamp: Date;

  constructor(success: boolean, message: string, data?: T, errors?: string[]) {
    this.success = success;
    this.message = message;
    this.data = data;
    this.errors = errors;
    this.timestamp = new Date();
  }

  static success<T>(message: string, data?: T): ApiResponseDto<T> {
    return new ApiResponseDto<T>(true, message, data);
  }

  static error(message: string, errors?: string[]): ApiResponseDto {
    return new ApiResponseDto(false, message, undefined, errors);
  }
}
