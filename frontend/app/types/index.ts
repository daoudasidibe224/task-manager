export type { User, UpdateUserDto } from "./user";

export type { Task, CreateTaskDto, UpdateTaskDto, TaskFilters } from "./task";

export type {
  TaskList,
  CreateTaskListDto,
  UpdateTaskListDto,
} from "./task-list";

export type { LoginDto, RegisterDto, AuthState } from "./auth";

export interface ApiResponse<T = unknown> {
  success: boolean;
  message: string;
  data?: T;
  errors?: string[];
  timestamp: string;
}
