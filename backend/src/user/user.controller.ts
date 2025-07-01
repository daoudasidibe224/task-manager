import {
  Controller,
  Body,
  Patch,
  Param,
  Delete,
  ValidationPipe,
  HttpStatus,
  HttpCode,
  UseGuards,
  ForbiddenException,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { UserService } from './user.service';
import { UpdateUserDto } from './dto/update-user.dto';
import { UserResponseDto } from './dto/user-response.dto';
import { ApiResponseDto } from '../common/dto/api-response.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { AuthenticatedUser } from '../auth/types/auth';

@ApiTags('User')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('user')
export class UserController {
  constructor(private readonly userService: UserService) {}

  @Patch(':id')
  @ApiOperation({ summary: 'Mettre à jour un utilisateur' })
  @ApiResponse({
    status: 200,
    description: 'Utilisateur mis à jour avec succès',
    type: UserResponseDto,
  })
  @ApiResponse({
    status: 400,
    description: 'Données invalides',
  })
  @ApiResponse({
    status: 401,
    description: 'Non authentifié',
  })
  @ApiResponse({
    status: 403,
    description:
      'Accès interdit - vous ne pouvez modifier que votre propre profil',
  })
  @ApiResponse({
    status: 404,
    description: 'Utilisateur non trouvé',
  })
  @ApiResponse({
    status: 409,
    description: 'Email déjà utilisé',
  })
  async update(
    @Param('id') id: string,
    @Body(new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true }))
    updateUserDto: UpdateUserDto,
    @CurrentUser() user: AuthenticatedUser,
  ): Promise<ApiResponseDto<UserResponseDto>> {
    // Vérifier que l'utilisateur ne peut modifier que son propre profil
    if (id !== user.id) {
      throw new ForbiddenException(
        'Vous ne pouvez modifier que votre propre profil',
      );
    }

    const updatedUser = await this.userService.update(id, updateUserDto);
    return ApiResponseDto.success(
      'Utilisateur mis à jour avec succès',
      updatedUser,
    );
  }

  @Delete(':id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Supprimer un utilisateur' })
  @ApiResponse({
    status: 200,
    description: 'Utilisateur supprimé avec succès',
  })
  @ApiResponse({
    status: 401,
    description: 'Non authentifié',
  })
  @ApiResponse({
    status: 403,
    description:
      'Accès interdit - vous ne pouvez supprimer que votre propre profil',
  })
  @ApiResponse({
    status: 404,
    description: 'Utilisateur non trouvé',
  })
  async remove(
    @Param('id') id: string,
    @CurrentUser() user: AuthenticatedUser,
  ): Promise<ApiResponseDto> {
    if (id !== user.id) {
      throw new ForbiddenException(
        'Vous ne pouvez supprimer que votre propre profil',
      );
    }

    await this.userService.remove(id);
    return ApiResponseDto.success('Utilisateur supprimé avec succès');
  }
}
