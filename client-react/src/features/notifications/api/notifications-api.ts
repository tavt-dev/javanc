import apiClient from "@/lib/api-client";
import type { ApiResponse } from "@/types/api";
import type { MessageDTO, NotificationDTO } from "@/types/notification";

export const notificationsApi = {
  async create(message: MessageDTO) {
    const response = await apiClient.post<ApiResponse<string>>(
      "/notification/create",
      message,
    );
    return response.data;
  },

  async findByUser(userId: number) {
    const response = await apiClient.get<ApiResponse<NotificationDTO[]>>(
      "/notification/user/findByUser",
      { params: { userId } },
    );
    return response.data;
  },

  async markRead(notification: NotificationDTO) {
    const response = await apiClient.post<ApiResponse<NotificationDTO>>(
      "/notification/update",
      { ...notification, read: true },
    );
    return response.data;
  },

  async healthCheck() {
    const response = await apiClient.get<ApiResponse<string>>(
      "/notification/getAll",
    );
    return response.data;
  },
};
