import { PartialType } from '@nestjs/swagger';
import { ValidateIf, IsISO8601 } from 'class-validator';
import { CreateUserDto } from './create-user.dto.js';
export class UpdateUserDto extends PartialType(CreateUserDto, {
  skipNullProperties: false,
}) {
  @ValidateIf((_object: unknown, value: unknown) => value !== undefined)
  @IsISO8601()
  expectedUpdatedAt?: string;
}
