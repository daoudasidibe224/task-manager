import {
  IsBoolean,
  IsArray,
  ArrayMaxSize,
  ValidateNested,
  IsUUID,
  IsDate,
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
  MaxLength,
  ValidateIf,
} from 'class-validator';
import { Type, Transform } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';
import { ChecklistItemDto } from './checklist.dto.js';
import { Priority } from '../../generated/prisma/enums.js';
export class CreateTaskDto {
  @ApiProperty({ required: false, format: 'uuid' })
  @ValidateIf((_object: unknown, value: unknown) => value !== undefined)
  @IsUUID('4')
  requestId?: string;
  @ApiProperty({ required: false, type: [ChecklistItemDto], maxItems: 20 })
  @ValidateIf((_object: unknown, value: unknown) => value !== undefined)
  @IsArray()
  @ArrayMaxSize(20)
  @ValidateNested({ each: true })
  @Type(() => ChecklistItemDto)
  checklist?: ChecklistItemDto[];
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
