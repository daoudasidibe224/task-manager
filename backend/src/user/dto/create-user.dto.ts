import {
  IsEmail,
  IsNotEmpty,
  IsString,
  MinLength,
  MaxLength,
} from 'class-validator';
import { Transform } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';
import { IsStrongPassword } from '../../common/validators/custom-validators.js';
import { VALIDATION_MESSAGES } from '../../common/constants/validation-messages.js';
import { ToLowerCaseAndTrim } from '../../common/decorators/lowercase-trim.decorator.js';

export class CreateUserDto {
  @ApiProperty({
    description: "Prénom de l'utilisateur",
    example: 'Jean',
    minLength: 1,
    maxLength: 50,
  })
  @IsNotEmpty({ message: VALIDATION_MESSAGES.FIRSTNAME.REQUIRED })
  @IsString({ message: VALIDATION_MESSAGES.FIRSTNAME.STRING })
  @MinLength(1, { message: VALIDATION_MESSAGES.FIRSTNAME.MIN_LENGTH })
  @MaxLength(50, { message: VALIDATION_MESSAGES.FIRSTNAME.MAX_LENGTH })
  @Transform(({ value }: { value: unknown }) =>
    typeof value === 'string' ? value.trim() : value,
  )
  firstname!: string;

  @ApiProperty({
    description: "Nom de famille de l'utilisateur",
    example: 'Dupont',
    minLength: 0,
    maxLength: 50,
  })
  @IsString({ message: VALIDATION_MESSAGES.LASTNAME.STRING })
  @MinLength(0, { message: VALIDATION_MESSAGES.LASTNAME.MIN_LENGTH })
  @MaxLength(50, { message: VALIDATION_MESSAGES.LASTNAME.MAX_LENGTH })
  @Transform(({ value }: { value: unknown }) =>
    typeof value === 'string' ? value.trim() : value,
  )
  lastname!: string;

  @ApiProperty({
    description: "Adresse email de l'utilisateur",
    example: 'jean.dupont@example.com',
    format: 'email',
    maxLength: 100,
  })
  @IsNotEmpty({ message: VALIDATION_MESSAGES.EMAIL.REQUIRED })
  @IsEmail({}, { message: VALIDATION_MESSAGES.EMAIL.VALID })
  @MaxLength(100, { message: VALIDATION_MESSAGES.EMAIL.MAX_LENGTH })
  @ToLowerCaseAndTrim()
  email!: string;

  @ApiProperty({
    description:
      "Mot de passe de l'utilisateur (doit contenir au moins 8 caractères, une majuscule, une minuscule et un chiffre)",
    example: 'MonMotDePasse123',
    minLength: 8,
    maxLength: 72,
  })
  @IsNotEmpty({ message: VALIDATION_MESSAGES.PASSWORD.REQUIRED })
  @IsString({ message: VALIDATION_MESSAGES.PASSWORD.STRING })
  @MaxLength(72)
  @IsStrongPassword()
  password!: string;
}
