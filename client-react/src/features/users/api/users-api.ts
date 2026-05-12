import apiClient from "@/lib/api-client";
import type { ApiResponse } from "@/types/api";
import type {
  AdminUserDTO,
  ChangeUserRoleRequest,
  ChangeUserStatusRequest,
  CreateUserAccountRequest,
  UpdateUserRequest,
} from "@/types/user";

export const usersApi = {
  async list(ids?: number[]) {
    const response = await apiClient.get<ApiResponse<AdminUserDTO[]>>("/users", {
      params: ids?.length ? { ids } : undefined,
    });
    return response.data;
  },

  async findById(userId: number) {
    const response = await apiClient.get<ApiResponse<AdminUserDTO>>(
      `/users/${userId}`,
    );
    return response.data;
  },

  async createAccount(input: CreateUserAccountRequest) {
    const response = await apiClient.post<ApiResponse<AdminUserDTO>>(
      "/users/admin/accounts",
      input,
    );
    return response.data;
  },

  async update(userId: number, input: UpdateUserRequest) {
    const response = await apiClient.patch<ApiResponse<AdminUserDTO>>(
      `/users/${userId}`,
      input,
    );
    return response.data;
  },

  async changeRole(userId: number, input: ChangeUserRoleRequest) {
    const response = await apiClient.patch<ApiResponse<AdminUserDTO>>(
      `/users/${userId}/role`,
      input,
    );
    return response.data;
  },

  async changeStatus(userId: number, input: ChangeUserStatusRequest) {
    const response = await apiClient.patch<ApiResponse<AdminUserDTO>>(
      `/users/${userId}/status`,
      input,
    );
    return response.data;
  },

  async delete(userId: number) {
    const response = await apiClient.delete<ApiResponse<AdminUserDTO>>(
      `/users/${userId}`,
    );
    return response.data;
  },
};
