import { PartialType } from '@nestjs/swagger';
import { ValidateIf, IsISO8601 } from 'class-validator';
import { CreateTaskListDto } from './create-task-list.dto.js';
export class UpdateTaskListDto extends PartialType(CreateTaskListDto, {
  skipNullProperties: false,
}) {
  @ValidateIf((_object: unknown, value: unknown) => value !== undefined)
  @IsISO8601()
  expectedUpdatedAt?: string;
}
