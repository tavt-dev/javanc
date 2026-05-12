import type { Role } from "@/types/auth";

export interface AdminUserDTO {
  id: number;
  name: string;
  email: string;
  idEmployee?: string;
  role: Role;
  status?: string;
  active: boolean;
}

export interface CreateUserAccountRequest {
  name: string;
  email: string;
  password: string;
  employeeId?: string;
  role: Role;
}

export interface UpdateUserRequest {
  name: string;
  email: string;
  password?: string;
  employeeId?: string;
  active?: boolean;
}

export interface ChangeUserRoleRequest {
  role: Role;
}

export interface ChangeUserStatusRequest {
  active: boolean;
  status?: string;
}

export interface InternalAccountFormValues {
  name: string;
  email: string;
  employeeId?: string;
  password: string;
  confirmPassword: string;
  role?: Role;
}
