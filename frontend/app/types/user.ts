// Type principal pour un utilisateur (réponse du backend)
export interface User {
  id: string;
  firstname: string;
  lastname: string;
  email: string;
  createdAt: string;
  updatedAt: string;
}

// Type pour la mise à jour d'un utilisateur (tous les champs optionnels)
export interface UpdateUserDto {
  firstname?: string;
  lastname?: string;
  email?: string;
  password?: string;
}
