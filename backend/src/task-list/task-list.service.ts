import { presentTask } from '../task/task-presenter.js';
import { Prisma } from '../generated/prisma/client.js';
import {
  Injectable,
  NotFoundException,
  ConflictException,
  ForbiddenException,
} from '@nestjs/common';
import { CreateTaskListDto } from './dto/create-task-list.dto.js';
import { UpdateTaskListDto } from './dto/update-task-list.dto.js';
import { PrismaService } from '../prisma.service.js';
import { TaskListResponseDto } from './dto/task-list-response.dto.js';
import { VALIDATION_MESSAGES } from '../common/constants/validation-messages.js';

@Injectable()
export class TaskListService {
  constructor(private prisma: PrismaService) {}

  async create(
    createTaskListDto: CreateTaskListDto,
    userId: string,
  ): Promise<TaskListResponseDto> {
    // Vérifier si une liste avec ce nom existe déjà pour cet utilisateur
    const existingTaskList = await this.prisma.taskList.findFirst({
      where: {
        name: createTaskListDto.name,
        userId: userId,
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
        userId: userId,
      },
      include: {
        tasks: true,
      },
    });
    return { ...taskList, tasks: taskList.tasks.map(presentTask) };
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

    return taskLists.map((list) => ({
      ...list,
      tasks: list.tasks.map(presentTask),
    }));
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

    return { ...taskList, tasks: taskList.tasks.map(presentTask) };
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

    const { expectedUpdatedAt, ...data } = updateTaskListDto;
    try {
      const updated = await this.prisma.taskList.update({
        where: {
          id,
          ...(expectedUpdatedAt
            ? { updatedAt: new Date(expectedUpdatedAt) }
            : {}),
        },
        data,
        include: { tasks: true },
      });
      return { ...updated, tasks: updated.tasks.map(presentTask) };
    } catch (error) {
      if (
        expectedUpdatedAt &&
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === 'P2025'
      )
        throw new ConflictException(
          'Cette liste a changé dans un autre onglet. Actualisez vos données avant de la modifier.',
        );
      throw error;
    }
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
