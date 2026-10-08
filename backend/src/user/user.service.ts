import {
  Injectable,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { PrismaService } from '../prisma.service.js';
import * as bcrypt from 'bcrypt';
import { CreateUserDto } from './dto/create-user.dto.js';
import { UpdateUserDto } from './dto/update-user.dto.js';
import { UserResponseDto } from './dto/user-response.dto.js';
import { VALIDATION_MESSAGES } from '../common/constants/validation-messages.js';
import { Prisma } from '../generated/prisma/client.js';
import { ConfigService } from '@nestjs/config';

type UserWithPassword = Prisma.UserGetPayload<{ include: { taskLists: true } }>;

@Injectable()
export class UserService {
  private readonly bcryptRounds: number;

  constructor(
    private prisma: PrismaService,
    private configService: ConfigService,
  ) {
    this.bcryptRounds =
      this.configService.get<number>('auth.bcryptRounds') || 12;
  }

  async findByEmail(email: string): Promise<UserResponseDto | null> {
    const user = await this.prisma.user.findUnique({ where: { email } });
    if (!user) return null;
    return new UserResponseDto(user);
  }

  async findByEmailWithPassword(
    email: string,
  ): Promise<UserWithPassword | null> {
    return this.prisma.user.findUnique({
      where: { email },
      include: { taskLists: true },
    });
  }

  async findOne(id: string): Promise<UserResponseDto | null> {
    const user = await this.prisma.user.findUnique({ where: { id } });
    if (!user) return null;
    return new UserResponseDto(user);
  }

  async create(createUserDto: CreateUserDto): Promise<UserResponseDto> {
    // Vérifier si l'email existe déjà
    const existingUser = await this.prisma.user.findUnique({
      where: { email: createUserDto.email },
    });

    if (existingUser) {
      throw new ConflictException('Un utilisateur avec cet email existe déjà');
    }

    // Hasher le mot de passe
    const hashedPassword = await bcrypt.hash(
      createUserDto.password,
      this.bcryptRounds,
    );

    const user = await this.prisma.user.create({
      data: { ...createUserDto, password: hashedPassword },
    });
    return new UserResponseDto(user);
  }

  async update(id: string, updateUserDto: UpdateUserDto) {
    // Vérifier si l'utilisateur existe
    const existingUser = await this.prisma.user.findUnique({
      where: { id },
    });

    if (!existingUser) {
      throw new NotFoundException(VALIDATION_MESSAGES.ERRORS.USER.NOT_FOUND);
    }

    // Si l'email est modifié, vérifier qu'il n'est pas déjà utilisé
    if (updateUserDto.email && updateUserDto.email !== existingUser.email) {
      const emailExists = await this.prisma.user.findUnique({
        where: { email: updateUserDto.email },
      });

      if (emailExists) {
        throw new ConflictException(
          VALIDATION_MESSAGES.ERRORS.USER.EMAIL_ALREADY_EXISTS,
        );
      }
    }

    const { expectedUpdatedAt, ...values } = updateUserDto;
    const updateData: Partial<CreateUserDto> = { ...values };

    // Si le mot de passe est modifié, le hasher
    if (updateUserDto.password) {
      updateData.password = await bcrypt.hash(
        updateUserDto.password,
        this.bcryptRounds,
      );
    }

    try {
      const user = await this.prisma.user.update({
        where: {
          id,
          ...(expectedUpdatedAt
            ? { updatedAt: new Date(expectedUpdatedAt) }
            : {}),
        },
        data: updateData,
      });
      return new UserResponseDto(user);
    } catch (error) {
      if (
        expectedUpdatedAt &&
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === 'P2025'
      )
        throw new ConflictException(
          'Votre profil a changé dans un autre onglet. Actualisez vos données avant de le modifier.',
        );
      throw error;
    }
  }

  async remove(id: string) {
    // Vérifier si l'utilisateur existe
    const existingUser = await this.prisma.user.findUnique({
      where: { id },
    });

    if (!existingUser) {
      throw new NotFoundException(VALIDATION_MESSAGES.ERRORS.USER.NOT_FOUND);
    }

    await this.prisma.user.delete({ where: { id } });
  }
}
