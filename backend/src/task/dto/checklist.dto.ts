import {
  IsBoolean,
  IsNotEmpty,
  IsString,
  IsUUID,
  MaxLength,
} from 'class-validator';
import { Transform } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';
import { z } from 'zod';
export class ChecklistItemDto {
  @ApiProperty() @IsUUID('4') id!: string;
  @ApiProperty({ maxLength: 200 })
  @IsString()
  @IsNotEmpty()
  @MaxLength(200)
  @Transform(({ value }: { value: unknown }) =>
    typeof value === 'string' ? value.trim() : value,
  )
  text!: string;
  @ApiProperty() @IsBoolean() completed!: boolean;
}
export const checklistSchema = z
  .array(
    z.object({
      id: z.uuid(),
      text: z.string().trim().min(1).max(200),
      completed: z.boolean(),
    }),
  )
  .max(20)
  .refine(
    (items) => new Set(items.map((item) => item.id)).size === items.length,
    { message: 'Chaque étape doit avoir un identifiant distinct.' },
  );
