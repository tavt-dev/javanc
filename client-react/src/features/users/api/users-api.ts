import apiClient from "@/lib/api-client";
import type { ApiResponse } from "@/types/api";
import type {
  AdminUserDTO,
  ChangeUserRoleRequest,
  ChangeUserStatusRequest,
  CreateHrPromotionRequest,
  CreateManagerUpgradeRequest,
  CreateUserAccountRequest,
  RejectRoleRequest,
  RoleRequestDTO,
  UpdateUserRequest,
  UserSearchParams,
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

const repeatedIdsSerializer = {
  serialize: (params: Record<string, unknown>) => {
    const searchParams = new URLSearchParams();
    const values = params.ids as number[] | undefined;
    values?.forEach((id) => searchParams.append("ids", String(id)));
    return searchParams.toString();
  },
};

export const usersApi = {
  async me() {
    const response = await apiClient.get<ApiResponse<RawAdminUserDTO>>("/users/me");
    return { ...response.data, data: normalizeUser(response.data.data) };
  },

  async list(ids?: number[]) {
    const response = await apiClient.get<ApiResponse<RawAdminUserDTO[]>>("/users", {
      params: ids?.length ? { ids } : undefined,
      paramsSerializer: repeatedIdsSerializer,
    });
    return { ...response.data, data: normalizeUsers(response.data.data ?? []) };
  },

  async search(params: UserSearchParams) {
    const response = await apiClient.get<ApiResponse<RawAdminUserDTO[]>>(
      "/users/search",
      {
        params: {
          query: params.query || undefined,
          role: params.role || undefined,
          page: params.page ?? 0,
          size: params.size ?? 10,
        },
      },
    );
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

  async requestManagerUpgrade(input: CreateManagerUpgradeRequest) {
    const response = await apiClient.post<ApiResponse<RoleRequestDTO>>(
      "/users/me/manager-upgrade-requests",
      input,
    );
    return response.data;
  },

  async myRoleRequests() {
    const response = await apiClient.get<ApiResponse<RoleRequestDTO[]>>(
      "/users/me/role-requests",
    );
    return response.data;
  },

  async adminRoleRequests(params?: {
    status?: string;
    type?: string;
  }) {
    const response = await apiClient.get<ApiResponse<RoleRequestDTO[]>>(
      "/users/admin/role-requests",
      { params },
    );
    return response.data;
  },

  async approveRoleRequest(requestId: number) {
    const response = await apiClient.patch<ApiResponse<RoleRequestDTO>>(
      `/users/admin/role-requests/${requestId}/approve`,
    );
    return response.data;
  },

  async rejectRoleRequest(requestId: number, input: RejectRoleRequest) {
    const response = await apiClient.patch<ApiResponse<RoleRequestDTO>>(
      `/users/admin/role-requests/${requestId}/reject`,
      input,
    );
    return response.data;
  },

  async requestHrPromotion(input: CreateHrPromotionRequest) {
    const response = await apiClient.post<ApiResponse<RoleRequestDTO>>(
      "/users/manager/hr-promotion-requests",
      input,
    );
    return response.data;
  },

  async myHrPromotions() {
    const response = await apiClient.get<ApiResponse<RoleRequestDTO[]>>(
      "/users/me/hr-promotion-requests",
    );
    return response.data;
  },

  async findRoleRequest(requestId: number) {
    const response = await apiClient.get<ApiResponse<RoleRequestDTO>>(
      `/users/role-requests/${requestId}`,
    );
    return response.data;
  },

  async acceptHrPromotion(requestId: number) {
    const response = await apiClient.patch<ApiResponse<RoleRequestDTO>>(
      `/users/me/hr-promotion-requests/${requestId}/accept`,
    );
    return response.data;
  },

  async rejectHrPromotion(requestId: number) {
    const response = await apiClient.patch<ApiResponse<RoleRequestDTO>>(
      `/users/me/hr-promotion-requests/${requestId}/reject`,
    );
    return response.data;
  },

  async leaveHr() {
    const response = await apiClient.patch<ApiResponse<RawAdminUserDTO>>(
      "/users/me/leave-hr",
    );
    return { ...response.data, data: normalizeUser(response.data.data) };
  },
};
