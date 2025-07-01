import {
  Injectable,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { CreateTaskDto } from './dto/create-task.dto';
import { UpdateTaskDto } from './dto/update-task.dto';
import { TaskResponseDto } from './dto/task-response.dto';
import { PrismaService } from '../prisma.service';
import { VALIDATION_MESSAGES } from '../common/constants/validation-messages';

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

    const { listId, ...data } = createTaskDto;
    const task = await this.prisma.task.create({
      data: {
        ...data,
        list: {
          connect: { id: listId },
        },
      },
    });
    return task as TaskResponseDto;
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

    return tasks as TaskResponseDto[];
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
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { list, ...taskWithoutList } = task;
    return taskWithoutList as TaskResponseDto;
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

    const updatedTask = await this.prisma.task.update({
      where: { id },
      data: updateTaskDto,
    });

    return updatedTask as TaskResponseDto;
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
