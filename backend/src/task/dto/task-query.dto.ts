import { IsIn, IsOptional, IsString, MaxLength } from 'class-validator';
export class TaskQueryDto {
  @IsOptional() @IsString() @MaxLength(100) listId?: string;
  @IsOptional() @IsIn(['true', 'false']) completed?: 'true' | 'false';
}
