import { OmitType, PartialType } from '@nestjs/swagger';
import { IsISO8601, ValidateIf } from 'class-validator';
import { CreateTaskDto } from './create-task.dto.js';
export class UpdateTaskDto extends PartialType(
  OmitType(CreateTaskDto, ['requestId'] as const),
  {
    skipNullProperties: false,
  },
) {
  @ValidateIf((_object: unknown, value: unknown) => value !== undefined)
  @IsISO8601()
  expectedUpdatedAt?: string;
}
