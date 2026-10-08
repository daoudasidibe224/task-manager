import type { Task } from '../generated/prisma/client.js';
import type { TaskResponseDto } from './dto/task-response.dto.js';
import { checklistSchema } from './dto/checklist.dto.js';
export function presentTask(task: Task): TaskResponseDto {
  return { ...task, checklist: checklistSchema.parse(task.checklist) };
}
