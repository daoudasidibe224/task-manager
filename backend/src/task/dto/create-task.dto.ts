import {
  IsBoolean,
  IsDate,
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
  MaxLength,
  ValidateIf,
} from 'class-validator';
import { Transform } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';
import { Priority } from '../../generated/prisma/enums.js';
export class CreateTaskDto {
  @ApiProperty({ maxLength: 200 })
  @IsString()
  @IsNotEmpty()
  @MaxLength(200)
  @Transform(({ value }: { value: unknown }) =>
    typeof value === 'string' ? value.trim() : value,
  )
  shortDescription!: string;
  @ApiProperty({ required: false, nullable: true, maxLength: 2000 })
  @IsOptional()
  @IsString()
  @MaxLength(2000)
  longDescription?: string | null;
  @ApiProperty({ required: false, nullable: true, type: Date })
  @IsOptional()
  @IsDate()
  @Transform(({ value }: { value: unknown }) =>
    typeof value === 'string' ? new Date(value) : value,
  )
  dueDate?: Date | null;
  @ApiProperty({ required: false, enum: Priority })
  @ValidateIf((_object: unknown, value: unknown) => value !== undefined)
  @IsEnum(Priority)
  priority?: Priority;
  @ApiProperty({ required: false })
  @ValidateIf((_object: unknown, value: unknown) => value !== undefined)
  @IsBoolean()
  completed?: boolean;
  @ApiProperty() @IsString() @IsNotEmpty() listId!: string;
}
