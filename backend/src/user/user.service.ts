import {
  Injectable,
  NotFoundException,
  ConflictException,
  InternalServerErrorException,
} from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import * as bcrypt from 'bcrypt';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { UserResponseDto } from './dto/user-response.dto';
import { VALIDATION_MESSAGES } from '../common/constants/validation-messages';
import { Prisma } from '../../generated/prisma';
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

    try {
      const user = await this.prisma.user.create({
        data: {
          ...createUserDto,
          password: hashedPassword,
        },
        select: {
          id: true,
          firstname: true,
          lastname: true,
          email: true,
          createdAt: true,
          updatedAt: true,
        },
      });

      return user;
    } catch {
      throw new InternalServerErrorException(
        "Erreur lors de la création de l'utilisateur",
      );
    }
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

    const updateData: Partial<CreateUserDto> = { ...updateUserDto };

    // Si le mot de passe est modifié, le hasher
    if (updateUserDto.password) {
      updateData.password = await bcrypt.hash(
        updateUserDto.password,
        this.bcryptRounds,
      );
    }

    try {
      const user = await this.prisma.user.update({
        where: { id },
        data: updateData,
        select: {
          id: true,
          firstname: true,
          lastname: true,
          email: true,
          createdAt: true,
          updatedAt: true,
        },
      });

      return user;
    } catch {
      throw new InternalServerErrorException(
        VALIDATION_MESSAGES.ERRORS.USER.UPDATE_FAILED,
      );
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

    try {
      await this.prisma.user.delete({
        where: { id },
      });

      return { message: 'Utilisateur supprimé avec succès' };
    } catch {
      throw new InternalServerErrorException(
        "Erreur lors de la suppression de l'utilisateur",
      );
    }
  }

  /**
   * Invalide le refresh token d'un utilisateur (pour le logout)
   */
  async invalidateRefreshToken(userId: string): Promise<void> {
    await this.prisma.user.update({
      where: { id: userId },
      data: { refreshToken: null },
    });
  }

  /**
   * Met à jour le refresh token d'un utilisateur
   */
  async updateRefreshToken(
    userId: string,
    refreshToken: string | null,
  ): Promise<void> {
    const hashedToken = refreshToken
      ? await bcrypt.hash(refreshToken, this.bcryptRounds)
      : null;

    await this.prisma.user.update({
      where: { id: userId },
      data: { refreshToken: hashedToken },
    });
  }
}
