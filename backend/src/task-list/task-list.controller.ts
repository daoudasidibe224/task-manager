import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  ValidationPipe,
  HttpStatus,
  HttpCode,
  UseGuards,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { TaskListService } from './task-list.service.js';
import { CreateTaskListDto } from './dto/create-task-list.dto.js';
import { UpdateTaskListDto } from './dto/update-task-list.dto.js';
import { TaskListResponseDto } from './dto/task-list-response.dto.js';
import { ApiResponseDto } from '../common/dto/api-response.dto.js';
import { CurrentUser } from '../auth/decorators/current-user.decorator.js';
import { AuthenticatedUser } from '../auth/types/auth.js';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard.js';

@ApiTags('Task Lists')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('task-lists')
export class TaskListController {
  constructor(private readonly taskListService: TaskListService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Créer une nouvelle liste de tâches' })
  @ApiResponse({
    status: 201,
    description: 'Liste de tâches créée avec succès',
    type: TaskListResponseDto,
  })
  @ApiResponse({
    status: 400,
    description: 'Données invalides',
  })
  async create(
    @Body(ValidationPipe) createTaskListDto: CreateTaskListDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    // Forcer l'userId à être celui de l'utilisateur connecté
    const taskList = await this.taskListService.create(
      createTaskListDto,
      user.id,
    );
    return ApiResponseDto.success(
      'Liste de tâches créée avec succès',
      taskList,
    );
  }

  @Get()
  @ApiOperation({
    summary: "Récupérer toutes les listes de tâches de l'utilisateur",
  })
  @ApiResponse({
    status: 200,
    description: 'Listes de tâches récupérées avec succès',
    type: [TaskListResponseDto],
  })
  async findAll(@CurrentUser() user: AuthenticatedUser) {
    const taskLists = await this.taskListService.findAllByUser(user.id);
    return ApiResponseDto.success(
      'Listes de tâches récupérées avec succès',
      taskLists,
    );
  }

  @Get(':id')
  @ApiOperation({ summary: 'Récupérer une liste de tâches par son ID' })
  @ApiResponse({
    status: 200,
    description: 'Liste de tâches récupérée avec succès',
    type: TaskListResponseDto,
  })
  @ApiResponse({
    status: 404,
    description: 'Liste de tâches non trouvée',
  })
  async findOne(
    @Param('id') id: string,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    const taskList = await this.taskListService.findOneByUser(id, user.id);
    return ApiResponseDto.success(
      'Liste de tâches récupérée avec succès',
      taskList,
    );
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Mettre à jour une liste de tâches' })
  @ApiResponse({
    status: 200,
    description: 'Liste de tâches mise à jour avec succès',
    type: TaskListResponseDto,
  })
  @ApiResponse({
    status: 400,
    description: 'Données invalides',
  })
  @ApiResponse({
    status: 404,
    description: 'Liste de tâches non trouvée',
  })
  async update(
    @Param('id') id: string,
    @Body(ValidationPipe) updateTaskListDto: UpdateTaskListDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    const taskList = await this.taskListService.updateByUser(
      id,
      updateTaskListDto,
      user.id,
    );
    return ApiResponseDto.success(
      'Liste de tâches mise à jour avec succès',
      taskList,
    );
  }

  @Delete(':id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Supprimer une liste de tâches' })
  @ApiResponse({
    status: 200,
    description: 'Liste de tâches supprimée avec succès',
  })
  @ApiResponse({
    status: 404,
    description: 'Liste de tâches non trouvée',
  })
  async remove(
    @Param('id') id: string,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    await this.taskListService.removeByUser(id, user.id);
    return ApiResponseDto.success('Liste de tâches supprimée avec succès');
  }
}
