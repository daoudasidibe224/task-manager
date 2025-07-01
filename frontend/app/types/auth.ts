/**
 * Types pour la gestion de l'authentification
 * Basés sur les DTOs du backend NestJS
 */

import type { User } from "./user";

// Type pour les données de connexion
export interface LoginDto {
  email: string;
  password: string;
}

// Type pour les données d'inscription
export interface RegisterDto {
  firstname: string;
  lastname: string;
  email: string;
  password: string;
}

// Type pour l'état d'authentification dans le store
export interface AuthState {
  user: User | null;
  loading: boolean;
  error: string | null;
}
