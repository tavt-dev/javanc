import type { Role } from "@/types/auth";

export type RoleRequestStatus =
  | "PENDING_SYSADMIN"
  | "PENDING_USER_CONFIRMATION"
  | "APPROVED"
  | "REJECTED"
  | "CANCELLED";

export type RoleRequestType = "MANAGER_UPGRADE" | "HR_PROMOTION";

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

export interface UserSearchParams {
  query?: string;
  role?: Role;
  active?: boolean;
  status?: string;
  page?: number;
  size?: number;
  sort?: string;
}

export interface CreateManagerUpgradeRequest {
  reason?: string;
}

export interface RejectRoleRequest {
  adminNote?: string;
}

export interface CreateHrPromotionRequest {
  targetUserId: number;
  companyId: number;
  companyName?: string;
}

export interface RoleRequestDTO {
  id: number;
  requesterUserId: number;
  targetUserId: number;
  requesterName?: string;
  requesterEmail?: string;
  targetName?: string;
  targetEmail?: string;
  requestedRole: Role;
  type: RoleRequestType;
  status: RoleRequestStatus;
  companyId?: number;
  companyName?: string;
  reason?: string;
  adminNote?: string;
  decidedByUserId?: number;
  createdAt?: string;
  updatedAt?: string;
  decidedAt?: string;
}

export interface InternalAccountFormValues {
  name: string;
  email: string;
  employeeId?: string;
  password: string;
  confirmPassword: string;
  role?: Role;
}
