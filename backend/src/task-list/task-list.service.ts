import {
  Injectable,
  NotFoundException,
  ConflictException,
  ForbiddenException,
} from '@nestjs/common';
import { CreateTaskListDto } from './dto/create-task-list.dto';
import { UpdateTaskListDto } from './dto/update-task-list.dto';
import { PrismaService } from '../prisma.service';
import { TaskListResponseDto } from './dto/task-list-response.dto';
import { VALIDATION_MESSAGES } from '../common/constants/validation-messages';

@Injectable()
export class TaskListService {
  constructor(private prisma: PrismaService) {}

  async create(
    createTaskListDto: CreateTaskListDto,
  ): Promise<TaskListResponseDto> {
    // S'assurer que userId est défini
    if (!createTaskListDto.userId) {
      throw new Error('User ID is required');
    }

    // Vérifier si une liste avec ce nom existe déjà pour cet utilisateur
    const existingTaskList = await this.prisma.taskList.findFirst({
      where: {
        name: createTaskListDto.name,
        userId: createTaskListDto.userId,
      },
    });

    if (existingTaskList) {
      throw new ConflictException(
        VALIDATION_MESSAGES.ERRORS.TASK_LIST.NAME_ALREADY_EXISTS,
      );
    }

    const taskList = await this.prisma.taskList.create({
      data: {
        name: createTaskListDto.name,
        userId: createTaskListDto.userId,
      },
      include: {
        tasks: true,
      },
    });
    return taskList as TaskListResponseDto;
  }

  async findAllByUser(userId: string): Promise<TaskListResponseDto[]> {
    const taskLists = await this.prisma.taskList.findMany({
      where: { userId },
      include: {
        tasks: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    return taskLists as TaskListResponseDto[];
  }

  async findOneByUser(
    id: string,
    userId: string,
  ): Promise<TaskListResponseDto> {
    const taskList = await this.prisma.taskList.findUnique({
      where: { id },
      include: {
        tasks: true,
      },
    });

    if (!taskList) {
      throw new NotFoundException(
        VALIDATION_MESSAGES.ERRORS.TASK_LIST.NOT_FOUND,
      );
    }

    if (taskList.userId !== userId) {
      throw new ForbiddenException(
        "Vous n'avez pas accès à cette liste de tâches",
      );
    }

    return taskList as TaskListResponseDto;
  }

  async updateByUser(
    id: string,
    updateTaskListDto: UpdateTaskListDto,
    userId: string,
  ): Promise<TaskListResponseDto> {
    // Vérifier si la liste existe et appartient à l'utilisateur
    const existingTaskList = await this.prisma.taskList.findUnique({
      where: { id },
    });

    if (!existingTaskList) {
      throw new NotFoundException(
        VALIDATION_MESSAGES.ERRORS.TASK_LIST.NOT_FOUND,
      );
    }

    if (existingTaskList.userId !== userId) {
      throw new ForbiddenException(
        "Vous n'avez pas accès à cette liste de tâches",
      );
    }

    // Si le nom est modifié, vérifier qu'il n'est pas déjà utilisé
    if (
      updateTaskListDto.name &&
      updateTaskListDto.name !== existingTaskList.name
    ) {
      const nameExists = await this.prisma.taskList.findFirst({
        where: {
          name: updateTaskListDto.name,
          userId,
          NOT: { id },
        },
      });

      if (nameExists) {
        throw new ConflictException(
          VALIDATION_MESSAGES.ERRORS.TASK_LIST.NAME_ALREADY_EXISTS,
        );
      }
    }

    const updatedTaskList = await this.prisma.taskList.update({
      where: { id },
      data: updateTaskListDto,
      include: {
        tasks: true,
      },
    });

    return updatedTaskList as TaskListResponseDto;
  }

  async removeByUser(id: string, userId: string): Promise<void> {
    const taskList = await this.prisma.taskList.findUnique({
      where: { id },
    });

    if (!taskList) {
      throw new NotFoundException(
        VALIDATION_MESSAGES.ERRORS.TASK_LIST.NOT_FOUND,
      );
    }

    if (taskList.userId !== userId) {
      throw new ForbiddenException(
        "Vous n'avez pas accès à cette liste de tâches",
      );
    }

    await this.prisma.taskList.delete({ where: { id } });
  }
}
