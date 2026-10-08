import { z } from "zod";
export const userSchema = z.object({
  id: z.string(),
  firstname: z.string(),
  lastname: z.string(),
  email: z.email(),
  createdAt: z.iso.datetime(),
  updatedAt: z.iso.datetime(),
});
export const prioritySchema = z.enum(["LOW", "NORMAL", "HIGH"]);
export const checklistItemSchema = z.object({
  id: z.uuid(),
  text: z.string().min(1).max(200),
  completed: z.boolean(),
});
export type ChecklistItem = z.infer<typeof checklistItemSchema>;
export const taskSchema = z.object({
  id: z.string(),
  shortDescription: z.string(),
  longDescription: z.string().nullable(),
  dueDate: z.iso.datetime().nullable(),
  completed: z.boolean(),
  checklist: checklistItemSchema.array().max(20),
  priority: prioritySchema,
  listId: z.string(),
  createdAt: z.iso.datetime(),
  updatedAt: z.iso.datetime(),
});
export const listSchema = z.object({
  id: z.string(),
  name: z.string(),
  userId: z.string(),
  createdAt: z.iso.datetime(),
  updatedAt: z.iso.datetime(),
  tasks: taskSchema.array(),
});
export const profileSchema = z.object({ user: userSchema });
export type User = z.infer<typeof userSchema>;
export type Task = z.infer<typeof taskSchema>;
export type TaskList = z.infer<typeof listSchema>;
export type Priority = z.infer<typeof prioritySchema>;
export interface TaskDraft {
  checklist: ChecklistItem[];
  shortDescription: string;
  longDescription: string;
  dueDate: string;
  priority: Priority;
  listId: string;
}
export const priorityLabels: Record<Priority, string> = {
  LOW: "Basse",
  NORMAL: "Normale",
  HIGH: "Haute",
};
export const priorityItems = [
  { label: "Haute", value: "HIGH" },
  { label: "Normale", value: "NORMAL" },
  { label: "Basse", value: "LOW" },
];
