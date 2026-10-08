import { PickType, ApiProperty } from '@nestjs/swagger';
import { IsString, MaxLength, MinLength, ValidateIf } from 'class-validator';
import { Transform } from 'class-transformer';
import { CreateUserDto } from '../../user/dto/create-user.dto.js';
export class RegisterDto extends PickType(CreateUserDto, [
  'email',
  'password',
] as const) {
  @ApiProperty({ required: false })
  @ValidateIf((_object: unknown, value: unknown) => value !== undefined)
  @IsString()
  @MinLength(1)
  @MaxLength(50)
  @Transform(({ value }: { value: unknown }) =>
    typeof value === 'string' ? value.trim() : value,
  )
  firstname?: string;
  @ApiProperty({ required: false })
  @ValidateIf((_object: unknown, value: unknown) => value !== undefined)
  @IsString()
  @MaxLength(50)
  @Transform(({ value }: { value: unknown }) =>
    typeof value === 'string' ? value.trim() : value,
  )
  lastname?: string;
}
