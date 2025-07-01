export interface User {
  id: string;
  firstname: string;
  lastname: string;
  email: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateUserDto {
  firstname: string;
  lastname: string;
  email: string;
  password: string;
}

export interface UpdateUserDto {
  firstname?: string;
  lastname?: string;
  email?: string;
  password?: string;
}
