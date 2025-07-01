export const VALIDATION_MESSAGES = {
  // Messages génériques
  REQUIRED: (field: string) => `${field} est requis`,
  STRING: (field: string) => `${field} doit être une chaîne de caractères`,
  BOOLEAN: (field: string) => `${field} doit être un booléen`,

  // Messages pour les longueurs
  MIN_LENGTH: (field: string, min: number) =>
    `${field} doit contenir au moins ${min} caractères`,
  MAX_LENGTH: (field: string, max: number) =>
    `${field} ne peut pas dépasser ${max} caractères`,

  // Messages spécifiques
  EMAIL_REQUIRED: "L'email est requis",
  EMAIL_VALID: "L'email doit être valide",

  PASSWORD_REQUIRED: 'Le mot de passe est requis',

  DUE_DATE_REQUIRED: "La date d'échéance est requise",
  DUE_DATE_VALID: "La date d'échéance doit être une date valide",

  // Messages pour les champs spécifiques
  FIRSTNAME: {
    REQUIRED: 'Le prénom est requis',
    STRING: 'Le prénom doit être une chaîne de caractères',
    MIN_LENGTH: 'Le prénom doit contenir au moins 2 caractères',
    MAX_LENGTH: 'Le prénom ne peut pas dépasser 50 caractères',
  },

  LASTNAME: {
    REQUIRED: 'Le nom est requis',
    STRING: 'Le nom doit être une chaîne de caractères',
    MIN_LENGTH: 'Le nom doit contenir au moins 2 caractères',
    MAX_LENGTH: 'Le nom ne peut pas dépasser 50 caractères',
  },

  EMAIL: {
    REQUIRED: "L'email est requis",
    VALID: "L'email doit être valide",
    MAX_LENGTH: "L'email ne peut pas dépasser 100 caractères",
  },

  PASSWORD: {
    REQUIRED: 'Le mot de passe est requis',
    STRING: 'Le mot de passe doit être une chaîne de caractères',
    MIN_LENGTH: 'Le mot de passe doit contenir au moins 8 caractères',
    MAX_LENGTH: 'Le mot de passe ne peut pas dépasser 50 caractères',
  },

  TASK_LIST_NAME: {
    REQUIRED: 'Le nom de la liste est requis',
    STRING: 'Le nom doit être une chaîne de caractères',
    MIN_LENGTH: 'Le nom doit contenir au moins 2 caractères',
    MAX_LENGTH: 'Le nom ne peut pas dépasser 100 caractères',
  },

  TASK_SHORT_DESCRIPTION: {
    REQUIRED: 'La description courte est requise',
    STRING: 'La description courte doit être une chaîne de caractères',
    MIN_LENGTH: 'La description courte doit contenir au moins 5 caractères',
    MAX_LENGTH: 'La description courte ne peut pas dépasser 200 caractères',
  },

  TASK_LONG_DESCRIPTION: {
    STRING: 'La description longue doit être une chaîne de caractères',
    MAX_LENGTH: 'La description longue ne peut pas dépasser 2000 caractères',
  },

  TASK_DUE_DATE: {
    REQUIRED: "La date d'échéance est requise",
    VALID:
      "La date d'échéance doit être une date valide au format ISO (YYYY-MM-DD ou YYYY-MM-DDTHH:mm:ss.sssZ)",
    NOT_IN_PAST: "La date d'échéance ne peut pas être dans le passé",
  },

  TASK_COMPLETED: {
    BOOLEAN: 'Le statut de completion doit être un booléen',
  },

  TASK_LIST_ID: {
    REQUIRED: "L'ID de la liste est requis",
    STRING: "L'ID de la liste doit être une chaîne de caractères",
  },

  USER_ID: {
    REQUIRED: "L'ID de l'utilisateur est requis",
    STRING: "L'ID de l'utilisateur doit être une chaîne de caractères",
  },

  // Messages d'erreur pour les services
  ERRORS: {
    USER: {
      NOT_FOUND: 'Utilisateur non trouvé',
      EMAIL_ALREADY_EXISTS: 'Un utilisateur avec cet email existe déjà',
      UPDATE_FAILED: "Erreur lors de la mise à jour de l'utilisateur",
    },
    TASK_LIST: {
      NOT_FOUND: 'Liste de tâches non trouvée',
      NAME_ALREADY_EXISTS: 'Une liste de tâches avec ce nom existe déjà',
      DELETE_SUCCESS: 'Liste de tâches supprimée avec succès',
    },
    TASK: {
      NOT_FOUND: 'Tâche non trouvée',
      DELETE_SUCCESS: 'Tâche supprimée avec succès',
    },
  },
};
