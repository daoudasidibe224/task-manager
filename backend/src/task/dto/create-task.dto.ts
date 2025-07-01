import {
  IsBoolean,
  IsNotEmpty,
  IsOptional,
  IsString,
  MaxLength,
  MinLength,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';
import { VALIDATION_MESSAGES } from '../../common/constants/validation-messages';
import { IsFutureDate } from '../../common/validators/custom-validators';
import { ToLowerCaseAndTrim } from '../../common/decorators/lowercase-trim.decorator';

export class CreateTaskDto {
  @ApiProperty({
    description: 'Description courte de la tâche',
    example: 'Terminer le rapport mensuel',
    minLength: 5,
    maxLength: 200,
  })
  @IsNotEmpty({ message: VALIDATION_MESSAGES.TASK_SHORT_DESCRIPTION.REQUIRED })
  @IsString({
    message: VALIDATION_MESSAGES.TASK_SHORT_DESCRIPTION.STRING,
  })
  @MinLength(5, {
    message: VALIDATION_MESSAGES.TASK_SHORT_DESCRIPTION.MIN_LENGTH,
  })
  @MaxLength(200, {
    message: VALIDATION_MESSAGES.TASK_SHORT_DESCRIPTION.MAX_LENGTH,
  })
  @ToLowerCaseAndTrim()
  shortDescription: string;

  @ApiProperty({
    description: 'Description détaillée de la tâche (optionnelle)',
    example:
      'Finaliser le rapport de vente du mois de juin avec tous les graphiques et analyses nécessaires',
    required: false,
    maxLength: 2000,
  })
  @IsOptional()
  @IsString({
    message: VALIDATION_MESSAGES.TASK_LONG_DESCRIPTION.STRING,
  })
  @MaxLength(2000, {
    message: VALIDATION_MESSAGES.TASK_LONG_DESCRIPTION.MAX_LENGTH,
  })
  @ToLowerCaseAndTrim()
  longDescription?: string;

  @ApiProperty({
    description: "Date d'échéance de la tâche (ne peut pas être dans le passé)",
    example: '2025-07-15T14:30:00.000Z',
    type: Date,
  })
  @IsNotEmpty({ message: VALIDATION_MESSAGES.TASK_DUE_DATE.REQUIRED })
  @IsFutureDate()
  @Type(() => Date)
  dueDate: Date;

  @ApiProperty({
    description: 'Statut de completion de la tâche',
    example: false,
    required: false,
    default: false,
  })
  @IsOptional()
  @IsBoolean({ message: VALIDATION_MESSAGES.TASK_COMPLETED.BOOLEAN })
  @Type(() => Boolean)
  completed?: boolean;

  @ApiProperty({
    description: 'Identifiant de la liste de tâches',
    example: 'clw8x9v2k0000en5qcz9g2f8a',
  })
  @IsNotEmpty({ message: VALIDATION_MESSAGES.TASK_LIST_ID.REQUIRED })
  @IsString({ message: VALIDATION_MESSAGES.TASK_LIST_ID.STRING })
  listId: string;
}
