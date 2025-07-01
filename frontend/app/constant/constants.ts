
export const VALIDATION_CONSTANTS = {
  USER: {
    FIRSTNAME_MIN_LENGTH: 2,
    FIRSTNAME_MAX_LENGTH: 50,
    LASTNAME_MIN_LENGTH: 2,
    LASTNAME_MAX_LENGTH: 50,
    EMAIL_MAX_LENGTH: 100,
    PASSWORD_MIN_LENGTH: 8,
    PASSWORD_MAX_LENGTH: 50,
  },
  TASK: {
    SHORT_DESCRIPTION_MIN_LENGTH: 5,
    SHORT_DESCRIPTION_MAX_LENGTH: 200,
    LONG_DESCRIPTION_MAX_LENGTH: 2000,
  },
  TASK_LIST: {
    NAME_MIN_LENGTH: 2,
    NAME_MAX_LENGTH: 100,
  },
} as const;

// Messages d'erreur de validation
export const VALIDATION_MESSAGES = {
  REQUIRED: 'Ce champ est requis',
  INVALID_EMAIL: 'Format d\'email invalide',
  PASSWORD_TOO_SHORT: `Le mot de passe doit contenir au moins ${VALIDATION_CONSTANTS.USER.PASSWORD_MIN_LENGTH} caractères`,
  PASSWORD_WEAK: 'Le mot de passe doit contenir au moins une majuscule, une minuscule et un chiffre',
  FIRSTNAME_TOO_SHORT: `Le prénom doit contenir au moins ${VALIDATION_CONSTANTS.USER.FIRSTNAME_MIN_LENGTH} caractères`,
  LASTNAME_TOO_SHORT: `Le nom doit contenir au moins ${VALIDATION_CONSTANTS.USER.LASTNAME_MIN_LENGTH} caractères`,
  TASK_DESCRIPTION_TOO_SHORT: `La description doit contenir au moins ${VALIDATION_CONSTANTS.TASK.SHORT_DESCRIPTION_MIN_LENGTH} caractères`,
  LIST_NAME_TOO_SHORT: `Le nom de la liste doit contenir au moins ${VALIDATION_CONSTANTS.TASK_LIST.NAME_MIN_LENGTH} caractères`,
  FUTURE_DATE_REQUIRED: 'La date d\'échéance ne peut pas être dans le passé',
} as const;
