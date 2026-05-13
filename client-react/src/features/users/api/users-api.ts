import apiClient from "@/lib/api-client";
import type { ApiResponse } from "@/types/api";
import type {
  AdminUserDTO,
  ChangeUserRoleRequest,
  ChangeUserStatusRequest,
  CreateUserAccountRequest,
  UpdateUserRequest,
} from "@/types/user";

type RawAdminUserDTO = AdminUserDTO & {
  employeeId?: string;
  isActive?: boolean;
};

function normalizeUser(user: RawAdminUserDTO): AdminUserDTO {
  return {
    ...user,
    idEmployee: user.idEmployee ?? user.employeeId,
    active: user.active ?? user.isActive ?? false,
  };
}

function normalizeUsers(users: RawAdminUserDTO[]) {
  return users.map(normalizeUser);
}

export const usersApi = {
  async list(ids?: number[]) {
    const response = await apiClient.get<ApiResponse<RawAdminUserDTO[]>>("/users", {
      params: ids?.length ? { ids } : undefined,
      paramsSerializer: {
        serialize: (params) => {
          const searchParams = new URLSearchParams();
          const values = params.ids as number[] | undefined;
          values?.forEach((id) => searchParams.append("ids", String(id)));
          return searchParams.toString();
        },
      },
    });
    return { ...response.data, data: normalizeUsers(response.data.data ?? []) };
  },

  async findById(userId: number) {
    const response = await apiClient.get<ApiResponse<RawAdminUserDTO>>(
      `/users/${userId}`,
    );
    return { ...response.data, data: normalizeUser(response.data.data) };
  },

  async createAccount(input: CreateUserAccountRequest) {
    const response = await apiClient.post<ApiResponse<RawAdminUserDTO>>(
      "/users/admin/accounts",
      input,
    );
    return { ...response.data, data: normalizeUser(response.data.data) };
  },

  async update(userId: number, input: UpdateUserRequest) {
    const response = await apiClient.patch<ApiResponse<RawAdminUserDTO>>(
      `/users/${userId}`,
      input,
    );
    return { ...response.data, data: normalizeUser(response.data.data) };
  },

  async changeRole(userId: number, input: ChangeUserRoleRequest) {
    const response = await apiClient.patch<ApiResponse<RawAdminUserDTO>>(
      `/users/${userId}/role`,
      input,
    );
    return { ...response.data, data: normalizeUser(response.data.data) };
  },

  async changeStatus(userId: number, input: ChangeUserStatusRequest) {
    const response = await apiClient.patch<ApiResponse<RawAdminUserDTO>>(
      `/users/${userId}/status`,
      input,
    );
    return { ...response.data, data: normalizeUser(response.data.data) };
  },

  async delete(userId: number) {
    const response = await apiClient.delete<ApiResponse<RawAdminUserDTO>>(
      `/users/${userId}`,
    );
    return { ...response.data, data: normalizeUser(response.data.data) };
  },
};
