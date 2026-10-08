import { Prisma } from '../generated/prisma/client.js';
import {
  Injectable,
  BadRequestException,
  NotFoundException,
  ForbiddenException,
  ConflictException,
} from '@nestjs/common';
import { CreateTaskDto } from './dto/create-task.dto.js';
import { UpdateTaskDto } from './dto/update-task.dto.js';
import { TaskResponseDto } from './dto/task-response.dto.js';
import { PrismaService } from '../prisma.service.js';
import { VALIDATION_MESSAGES } from '../common/constants/validation-messages.js';

import { createHash } from 'node:crypto';
import { checklistSchema } from './dto/checklist.dto.js';
import { presentTask } from './task-presenter.js';
interface TaskFilter {
  listId?: string;
  completed?: boolean;
}

@Injectable()
export class TaskService {
  constructor(private prisma: PrismaService) {}

  async createForUser(
    createTaskDto: CreateTaskDto,
    userId: string,
  ): Promise<TaskResponseDto> {
    // Vérifier que la liste appartient bien à l'utilisateur
    const list = await this.prisma.taskList.findUnique({
      where: { id: createTaskDto.listId },
    });

    if (!list) {
      throw new NotFoundException('Liste de tâches non trouvée');
    }

    if (list.userId !== userId) {
      throw new ForbiddenException(
        "Vous n'avez pas accès à cette liste de tâches",
      );
    }

    const { listId, requestId, checklist, ...fields } = createTaskDto;
    const checked = checklistSchema.safeParse(checklist ?? []);
    if (!checked.success)
      throw new BadRequestException(
        'Les étapes doivent être valides et leurs identifiants distincts.',
      );
    const data = {
      ...fields,
      checklist: checked.data.map((item) => ({ ...item })),
      listId,
    };
    if (!requestId) return presentTask(await this.prisma.task.create({ data }));
    const hash = createHash('sha256')
      .update(
        JSON.stringify({
          listId,
          shortDescription: fields.shortDescription,
          longDescription: fields.longDescription ?? null,
          dueDate: fields.dueDate?.toISOString() ?? null,
          priority: fields.priority ?? 'NORMAL',
          completed: fields.completed ?? false,
          checklist: checked.data,
        }),
      )
      .digest('hex');
    try {
      return await this.prisma.$transaction(async (transaction) => {
        await transaction.taskCreation.create({
          data: { id: requestId, userId, payloadHash: hash },
        });
        const task = await transaction.task.create({ data });
        await transaction.taskCreation.update({
          where: { id: requestId },
          data: { taskId: task.id },
        });
        return presentTask(task);
      });
    } catch (error) {
      if (
        !(error instanceof Prisma.PrismaClientKnownRequestError) ||
        error.code !== 'P2002'
      )
        throw error;
      const existing = await this.prisma.taskCreation.findUnique({
        where: { id: requestId },
        include: { task: true },
      });
      if (
        !existing ||
        existing.userId !== userId ||
        existing.payloadHash !== hash ||
        !existing.task
      )
        throw new ConflictException(
          'Cette création a changé ou sa tâche a été supprimée. Ouvrez un nouveau formulaire.',
        );
      return presentTask(existing.task);
    }
  }

  async findAllByUser(
    userId: string,
    filters: TaskFilter = {},
  ): Promise<TaskResponseDto[]> {
    // Construire les conditions de filtre
    const where: {
      list: { userId: string };
      listId?: string;
      completed?: boolean;
    } = {
      list: {
        userId,
      },
    };

    if (filters.listId) {
      where.listId = filters.listId;
    }

    if (filters.completed !== undefined) {
      where.completed = filters.completed;
    }

    const tasks = await this.prisma.task.findMany({
      where,
      orderBy: {
        dueDate: 'asc',
      },
    });

    return tasks.map(presentTask);
  }

  async findOneByUser(id: string, userId: string): Promise<TaskResponseDto> {
    const task = await this.prisma.task.findUnique({
      where: { id },
      include: {
        list: true,
      },
    });

    if (!task) {
      throw new NotFoundException(VALIDATION_MESSAGES.ERRORS.TASK.NOT_FOUND);
    }

    if (task.list.userId !== userId) {
      throw new ForbiddenException("Vous n'avez pas accès à cette tâche");
    }

    // Ne pas retourner les informations de la liste
    const { list: _list, ...taskWithoutList } = task;
    return presentTask(taskWithoutList);
  }

  async updateByUser(
    id: string,
    updateTaskDto: UpdateTaskDto,
    userId: string,
  ): Promise<TaskResponseDto> {
    // Vérifier que la tâche existe et appartient à l'utilisateur
    const task = await this.prisma.task.findUnique({
      where: { id },
      include: {
        list: true,
      },
    });

    if (!task) {
      throw new NotFoundException(VALIDATION_MESSAGES.ERRORS.TASK.NOT_FOUND);
    }

    if (task.list.userId !== userId) {
      throw new ForbiddenException("Vous n'avez pas accès à cette tâche");
    }

    // Si on change la liste, vérifier que la nouvelle liste appartient à l'utilisateur
    if (updateTaskDto.listId && updateTaskDto.listId !== task.listId) {
      const newList = await this.prisma.taskList.findUnique({
        where: { id: updateTaskDto.listId },
      });

      if (!newList) {
        throw new NotFoundException('Liste de tâches non trouvée');
      }

      if (newList.userId !== userId) {
        throw new ForbiddenException(
          "Vous n'avez pas accès à cette liste de tâches",
        );
      }
    }

    const { expectedUpdatedAt, checklist, ...fields } = updateTaskDto;
    const checked = checklistSchema.safeParse(checklist ?? []);
    if (!checked.success)
      throw new BadRequestException(
        'Les étapes doivent être valides et leurs identifiants distincts.',
      );
    const data = {
      ...fields,
      ...(checklist !== undefined
        ? { checklist: checked.data.map((item) => ({ ...item })) }
        : {}),
    };
    try {
      return presentTask(
        await this.prisma.task.update({
          where: {
            id,
            ...(expectedUpdatedAt
              ? { updatedAt: new Date(expectedUpdatedAt) }
              : {}),
          },
          data,
        }),
      );
    } catch (error) {
      if (
        expectedUpdatedAt &&
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === 'P2025'
      )
        throw new ConflictException(
          'Cette tâche a changé dans un autre onglet. Actualisez vos données avant de la modifier.',
        );
      throw error;
    }
  }

  async removeByUser(id: string, userId: string): Promise<void> {
    const task = await this.prisma.task.findUnique({
      where: { id },
      include: {
        list: true,
      },
    });

    if (!task) {
      throw new NotFoundException(VALIDATION_MESSAGES.ERRORS.TASK.NOT_FOUND);
    }

    if (task.list.userId !== userId) {
      throw new ForbiddenException("Vous n'avez pas accès à cette tâche");
    }

    await this.prisma.task.delete({ where: { id } });
  }
}
