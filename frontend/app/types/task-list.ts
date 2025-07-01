import type { Task } from './task';

export interface TaskList {
  id: string;
  name: string;
  userId: string;
  createdAt: string;
  updatedAt: string;
  tasks: Task[];
}

export interface CreateTaskListDto {
  name: string;
  userId?: string;
}

export interface UpdateTaskListDto {
  name?: string;
  userId?: string;
}
