import {
  IsNotEmpty,
  IsString,
  MaxLength,
  MinLength,
  IsOptional,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { VALIDATION_MESSAGES } from '../../common/constants/validation-messages';
import { ToLowerCaseAndTrim } from '../../common/decorators/lowercase-trim.decorator';

export class CreateTaskListDto {
  @ApiProperty({
    description: 'Nom de la liste de tâches',
    example: 'Mes tâches importantes',
    minLength: 2,
    maxLength: 100,
  })
  @IsNotEmpty({ message: VALIDATION_MESSAGES.TASK_LIST_NAME.REQUIRED })
  @IsString({ message: VALIDATION_MESSAGES.TASK_LIST_NAME.STRING })
  @MinLength(2, { message: VALIDATION_MESSAGES.TASK_LIST_NAME.MIN_LENGTH })
  @MaxLength(100, { message: VALIDATION_MESSAGES.TASK_LIST_NAME.MAX_LENGTH })
  @ToLowerCaseAndTrim()
  name: string;

  @ApiProperty({
    description: 'Identifiant du propriétaire de la liste',
    example: 'clw8x9v2k0000en5qcz9g2f8a',
    required: false,
  })
  @IsOptional()
  @IsString({ message: VALIDATION_MESSAGES.USER_ID.STRING })
  userId?: string;
}
