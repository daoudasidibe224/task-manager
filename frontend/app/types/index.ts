export type { User, CreateUserDto, UpdateUserDto } from "./user";

export type {
  LoginDto,
  RegisterDto,
  AuthResponse,
  RefreshTokenDto,
  AuthState,
  AuthError,
  UserSession,
} from "./auth";

export interface ApiResponse<T = unknown> {
  success: boolean;
  message: string;
  data?: T;
  errors?: string[];
  timestamp: string;
}

export interface ApiError {
  message: string;
  error?: string;
  statusCode?: number;
  timestamp?: string;
  path?: string;
}
