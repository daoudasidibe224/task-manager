/**
 * Types pour la gestion de l'authentification
 * Basés sur les DTOs du backend NestJS
 */

import type { User } from "./user";

export interface LoginDto {
  email: string;
  password: string;
}

export interface RegisterDto {
  firstname: string;
  lastname: string;
  email: string;
  password: string;
}

export interface AuthResponse {
  user: User;
  success: boolean;
  message: string;
  tokens?: {
    accessToken: string;
    refreshToken: string;
  };
  clearCookies?: boolean;
}

export interface RefreshTokenDto {
  refreshToken: string;
}

export interface AuthState {
  user: User | null;
  loading: boolean;
  error: string | null;
}

export interface AuthError {
  message: string;
  statusCode?: number;
  error?: string;
}

export interface UserSession {
  user: User;
  accessToken: string;
  expiresAt: string;
}
