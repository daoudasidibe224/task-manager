export interface Task {
  id: string;
  shortDescription: string;
  longDescription?: string;
  dueDate: string;
  completed: boolean;
  listId: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateTaskDto {
  shortDescription: string;
  longDescription?: string;
  dueDate: Date;
  completed?: boolean;
  listId: string;
}

export interface UpdateTaskDto {
  shortDescription?: string;
  longDescription?: string;
  dueDate?: Date;
  completed?: boolean;
  listId?: string;
}

export interface TaskFilters {
  listId?: string;
  completed?: boolean;
}
