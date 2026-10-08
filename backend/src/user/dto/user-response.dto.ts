import { ApiProperty } from '@nestjs/swagger';
import type { User } from '../../generated/prisma/client.js';
export class UserResponseDto {
  @ApiProperty() id: string;
  @ApiProperty() firstname: string;
  @ApiProperty() lastname: string;
  @ApiProperty() email: string;
  @ApiProperty() createdAt: Date;
  @ApiProperty() updatedAt: Date;
  constructor(
    user: Pick<
      User,
      'id' | 'firstname' | 'lastname' | 'email' | 'createdAt' | 'updatedAt'
    >,
  ) {
    this.id = user.id;
    this.firstname = user.firstname;
    this.lastname = user.lastname;
    this.email = user.email;
    this.createdAt = user.createdAt;
    this.updatedAt = user.updatedAt;
  }
}
