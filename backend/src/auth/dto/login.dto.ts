import { IsEmail, IsString, MinLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { ToLowerCaseAndTrim } from '../../common/decorators/lowercase-trim.decorator';

export class LoginDto {
  @ApiProperty({
    description: "Email de l'utilisateur",
    example: 'john.doe@example.com',
  })
  @IsEmail({}, { message: "Format d'email invalide" })
  @ToLowerCaseAndTrim()
  email: string;

  @ApiProperty({
    description: "Mot de passe de l'utilisateur",
    example: 'Motdepasse123',
    minLength: 8,
  })
  @IsString({ message: 'Le mot de passe doit être une chaîne de caractères' })
  @MinLength(8, {
    message: 'Le mot de passe doit contenir au moins 8 caractères',
  })
  password: string;
}
