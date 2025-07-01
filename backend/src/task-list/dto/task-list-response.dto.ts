import { Type } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';
import { TaskResponseDto } from '../../task/dto/task-response.dto';

export class TaskListResponseDto {
  @ApiProperty({
    description: 'Identifiant unique de la liste de tâches',
    example: 'clw8x9v2k0000en5qcz9g2f8a',
  })
  id: string;

  @ApiProperty({
    description: 'Nom de la liste de tâches',
    example: 'Mes tâches importantes',
  })
  name: string;

  @ApiProperty({
    description: 'Identifiant du propriétaire de la liste',
    example: 'clw8x9v2k0000en5qcz9g2f8a',
  })
  userId: string;

  @ApiProperty({
    description: 'Date de création de la liste',
    example: '2025-06-28T10:30:00.000Z',
    type: Date,
  })
  createdAt: Date;

  @ApiProperty({
    description: 'Date de dernière mise à jour de la liste',
    example: '2025-06-28T10:30:00.000Z',
    type: Date,
  })
  updatedAt: Date;

  @ApiProperty({
    description: 'Liste des tâches associées',
    type: [TaskResponseDto],
  })
  @Type(() => TaskResponseDto)
  tasks: TaskResponseDto[];
}
