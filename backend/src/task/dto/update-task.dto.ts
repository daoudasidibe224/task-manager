import { PartialType, ApiProperty } from '@nestjs/swagger';
import { CreateTaskDto } from './create-task.dto';
import { IsBoolean, IsOptional } from 'class-validator';

export class UpdateTaskDto extends PartialType(CreateTaskDto) {
  @ApiProperty({
    description: 'Statut de complétion de la tâche',
    example: true,
    required: false,
  })
  @IsOptional()
  @IsBoolean({ message: 'Le statut de completion doit être un booléen' })
  completed?: boolean;
}
