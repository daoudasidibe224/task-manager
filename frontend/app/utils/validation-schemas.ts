import { z } from "zod";
import {
  VALIDATION_MESSAGES,
  VALIDATION_CONSTANTS,
} from "~/constant/constants";

// Schéma pour les utilisateurs (register)
export const userSchema = z.object({
  firstname: z
    .string({ required_error: VALIDATION_MESSAGES.REQUIRED })
    .min(
      VALIDATION_CONSTANTS.USER.FIRSTNAME_MIN_LENGTH,
      VALIDATION_MESSAGES.FIRSTNAME_TOO_SHORT
    )
    .max(
      VALIDATION_CONSTANTS.USER.FIRSTNAME_MAX_LENGTH,
      `Le prénom ne peut pas dépasser ${VALIDATION_CONSTANTS.USER.FIRSTNAME_MAX_LENGTH} caractères`
    )
    .trim(),
  lastname: z
    .string({ required_error: VALIDATION_MESSAGES.REQUIRED })
    .min(
      VALIDATION_CONSTANTS.USER.LASTNAME_MIN_LENGTH,
      VALIDATION_MESSAGES.LASTNAME_TOO_SHORT
    )
    .max(
      VALIDATION_CONSTANTS.USER.LASTNAME_MAX_LENGTH,
      `Le nom ne peut pas dépasser ${VALIDATION_CONSTANTS.USER.LASTNAME_MAX_LENGTH} caractères`
    )
    .trim(),
  email: z
    .string({ required_error: VALIDATION_MESSAGES.REQUIRED })
    .email(VALIDATION_MESSAGES.INVALID_EMAIL)
    .max(
      VALIDATION_CONSTANTS.USER.EMAIL_MAX_LENGTH,
      `L'email ne peut pas dépasser ${VALIDATION_CONSTANTS.USER.EMAIL_MAX_LENGTH} caractères`
    )
    .toLowerCase()
    .trim(),
  password: z
    .string({ required_error: VALIDATION_MESSAGES.REQUIRED })
    .min(
      VALIDATION_CONSTANTS.USER.PASSWORD_MIN_LENGTH,
      VALIDATION_MESSAGES.PASSWORD_TOO_SHORT
    )
    .max(
      VALIDATION_CONSTANTS.USER.PASSWORD_MAX_LENGTH,
      `Le mot de passe ne peut pas dépasser ${VALIDATION_CONSTANTS.USER.PASSWORD_MAX_LENGTH} caractères`
    )
    .regex(
      /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$/,
      VALIDATION_MESSAGES.PASSWORD_WEAK
    ),
});

// Schéma pour le login
export const loginSchema = z.object({
  email: z
    .string({ required_error: VALIDATION_MESSAGES.REQUIRED })
    .email(VALIDATION_MESSAGES.INVALID_EMAIL)
    .toLowerCase()
    .trim(),
  password: z
    .string({ required_error: VALIDATION_MESSAGES.REQUIRED })
    .min(
      VALIDATION_CONSTANTS.USER.PASSWORD_MIN_LENGTH,
      VALIDATION_MESSAGES.PASSWORD_TOO_SHORT
    ),
});

// Schéma pour les listes de tâches
export const taskListSchema = z.object({
  name: z
    .string({ required_error: VALIDATION_MESSAGES.REQUIRED })
    .min(
      VALIDATION_CONSTANTS.TASK_LIST.NAME_MIN_LENGTH,
      VALIDATION_MESSAGES.LIST_NAME_TOO_SHORT
    )
    .max(
      VALIDATION_CONSTANTS.TASK_LIST.NAME_MAX_LENGTH,
      `Le nom de la liste ne peut pas dépasser ${VALIDATION_CONSTANTS.TASK_LIST.NAME_MAX_LENGTH} caractères`
    )
    .trim(),
});

// Schéma pour les tâches
export const taskSchema = z.object({
  shortDescription: z
    .string({ required_error: VALIDATION_MESSAGES.REQUIRED })
    .min(
      VALIDATION_CONSTANTS.TASK.SHORT_DESCRIPTION_MIN_LENGTH,
      VALIDATION_MESSAGES.TASK_DESCRIPTION_TOO_SHORT
    )
    .max(
      VALIDATION_CONSTANTS.TASK.SHORT_DESCRIPTION_MAX_LENGTH,
      `La description ne peut pas dépasser ${VALIDATION_CONSTANTS.TASK.SHORT_DESCRIPTION_MAX_LENGTH} caractères`
    )
    .trim(),
  longDescription: z
    .string()
    .max(
      VALIDATION_CONSTANTS.TASK.LONG_DESCRIPTION_MAX_LENGTH,
      `La description longue ne peut pas dépasser ${VALIDATION_CONSTANTS.TASK.LONG_DESCRIPTION_MAX_LENGTH} caractères`
    )
    .trim()
    .optional(),
  dueDate: z.string({ required_error: VALIDATION_MESSAGES.REQUIRED }).refine(
    (date) => {
      const selectedDate = new Date(date);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      return selectedDate >= today;
    },
    {
      message: VALIDATION_MESSAGES.FUTURE_DATE_REQUIRED,
    }
  ),
  listId: z.string({ required_error: VALIDATION_MESSAGES.REQUIRED }),
});

// Types inférés
export type UserSchema = z.infer<typeof userSchema>;
export type LoginSchema = z.infer<typeof loginSchema>;
export type TaskListSchema = z.infer<typeof taskListSchema>;
export type TaskSchema = z.infer<typeof taskSchema>;
