import { ApiProperty } from '@nestjs/swagger';
import type { Priority } from '../../generated/prisma/enums.js';
export class TaskResponseDto {
  @ApiProperty() id!: string;
  @ApiProperty() shortDescription!: string;
  @ApiProperty({ nullable: true }) longDescription!: string | null;
  @ApiProperty({ nullable: true, type: Date }) dueDate!: Date | null;
  @ApiProperty() completed!: boolean;
  @ApiProperty() priority!: Priority;
  @ApiProperty() listId!: string;
  @ApiProperty() createdAt!: Date;
  @ApiProperty() updatedAt!: Date;
}
