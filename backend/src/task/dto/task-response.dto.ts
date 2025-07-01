import { ApiProperty } from '@nestjs/swagger';

export class TaskResponseDto {
  @ApiProperty({
    description: 'Identifiant unique de la tâche',
    example: 'clw8x9v2k0001en5qcz9g2f8b',
  })
  id: string;

  @ApiProperty({
    description: 'Description courte de la tâche',
    example: 'Terminer le rapport mensuel',
  })
  shortDescription: string;

  @ApiProperty({
    description: 'Description détaillée de la tâche (optionnelle)',
    example:
      'Finaliser le rapport de vente du mois de juin avec tous les graphiques et analyses',
    required: false,
  })
  longDescription?: string;

  @ApiProperty({
    description: "Date d'échéance de la tâche",
    example: '2025-07-15T14:30:00.000Z',
    type: Date,
  })
  dueDate: Date;

  @ApiProperty({
    description: 'Statut de completion de la tâche',
    example: false,
  })
  completed: boolean;

  @ApiProperty({
    description: 'Identifiant de la liste de tâches',
    example: 'clw8x9v2k0000en5qcz9g2f8a',
  })
  listId: string;

  @ApiProperty({
    description: 'Date de création',
    example: '2025-06-28T10:30:00.000Z',
    type: Date,
  })
  createdAt: Date;

  @ApiProperty({
    description: 'Date de dernière mise à jour',
    example: '2025-06-28T10:30:00.000Z',
    type: Date,
  })
  updatedAt: Date;
}
