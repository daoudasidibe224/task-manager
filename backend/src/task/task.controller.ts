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
  Query,
  UseGuards,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiQuery,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { TaskService } from './task.service';
import { CreateTaskDto } from './dto/create-task.dto';
import { UpdateTaskDto } from './dto/update-task.dto';
import { TaskResponseDto } from './dto/task-response.dto';
import { ApiResponseDto } from '../common/dto/api-response.dto';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { AuthenticatedUser } from '../auth/types/auth';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@ApiTags('Task')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('task')
export class TaskController {
  constructor(private readonly taskService: TaskService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Créer une nouvelle tâche' })
  @ApiResponse({
    status: 201,
    description: 'Tâche créée avec succès',
    type: TaskResponseDto,
  })
  @ApiResponse({
    status: 400,
    description: 'Données invalides',
  })
  async create(
    @Body(ValidationPipe) createTaskDto: CreateTaskDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    const task = await this.taskService.createForUser(createTaskDto, user.id);
    return ApiResponseDto.success('Tâche créée avec succès', task);
  }

  @Get()
  @ApiOperation({ summary: "Récupérer toutes les tâches de l'utilisateur" })
  @ApiQuery({
    name: 'listId',
    required: false,
    type: String,
    description: 'Filtrer par ID de liste',
  })
  @ApiQuery({
    name: 'completed',
    required: false,
    type: Boolean,
    description: 'Filtrer par statut de complétion',
  })
  @ApiResponse({
    status: 200,
    description: 'Tâches récupérées avec succès',
    type: [TaskResponseDto],
  })
  async findAll(
    @CurrentUser() user: AuthenticatedUser,
    @Query('listId') listId?: string,
    @Query('completed') completed?: string,
  ) {
    const isCompleted =
      completed === 'true' ? true : completed === 'false' ? false : undefined;

    const tasks = await this.taskService.findAllByUser(user.id, {
      listId,
      completed: isCompleted,
    });
    return ApiResponseDto.success('Tâches récupérées avec succès', tasks);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Récupérer une tâche par son ID' })
  @ApiResponse({
    status: 200,
    description: 'Tâche récupérée avec succès',
    type: TaskResponseDto,
  })
  @ApiResponse({
    status: 404,
    description: 'Tâche non trouvée',
  })
  async findOne(
    @Param('id') id: string,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    const task = await this.taskService.findOneByUser(id, user.id);
    return ApiResponseDto.success('Tâche récupérée avec succès', task);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Mettre à jour une tâche' })
  @ApiResponse({
    status: 200,
    description: 'Tâche mise à jour avec succès',
    type: TaskResponseDto,
  })
  @ApiResponse({
    status: 400,
    description: 'Données invalides',
  })
  @ApiResponse({
    status: 404,
    description: 'Tâche non trouvée',
  })
  async update(
    @Param('id') id: string,
    @Body(ValidationPipe) updateTaskDto: UpdateTaskDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    const task = await this.taskService.updateByUser(
      id,
      updateTaskDto,
      user.id,
    );
    return ApiResponseDto.success('Tâche mise à jour avec succès', task);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Supprimer une tâche' })
  @ApiResponse({
    status: 200,
    description: 'Tâche supprimée avec succès',
  })
  @ApiResponse({
    status: 404,
    description: 'Tâche non trouvée',
  })
  async remove(
    @Param('id') id: string,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    await this.taskService.removeByUser(id, user.id);
    return ApiResponseDto.success('Tâche supprimée avec succès');
  }
}
