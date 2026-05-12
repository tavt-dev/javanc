import apiClient from "@/lib/api-client";
import type { ApiResponse } from "@/types/api";
import type { NotificationDTO } from "@/types/notification";

export const notificationsApi = {
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
};
