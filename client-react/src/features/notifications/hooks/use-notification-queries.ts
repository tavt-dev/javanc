import { useMutation, useQuery } from "@tanstack/react-query";
import { toast } from "sonner";
import { extractErrorMessage } from "@/lib/api-error";
import { queryClient } from "@/lib/query-client";
import { notificationsApi } from "@/features/notifications/api/notifications-api";
import type { NotificationDTO } from "@/types/notification";
import type { PageParams, PageResponse } from "@/types/api";

export const notificationKeys = {
  all: ["notifications"] as const,
  user: (userId: number) => ["notifications", "user", userId] as const,
};

export function useNotificationsQuery(
  userId?: number | null,
  params: PageParams & { read?: boolean } = {},
) {
  const query = useQuery({
    queryKey: userId
      ? [...notificationKeys.user(userId), params]
      : ["notifications", "user", "missing"],
    queryFn: async () => {
      if (!userId) return null;
      const response = await notificationsApi.findByUser(userId, params);
      return response.data;
    },
    enabled: Boolean(userId),
    refetchInterval: 30_000,
  });

  return {
    ...query,
    page: query.data,
    notifications: query.data?.items ?? [],
    unreadCount: (query.data?.items ?? []).filter((notification) => !notification.read)
      .length,
  };
}

export function useMarkNotificationReadMutation(userId: number) {
  return useMutation({
    mutationFn: (notification: NotificationDTO) =>
      notificationsApi.markRead(notification),
    onMutate: async (notification) => {
      const key = notificationKeys.user(userId);
      await queryClient.cancelQueries({ queryKey: key });
      const previous = queryClient.getQueriesData<PageResponse<NotificationDTO>>({ queryKey: key });
      queryClient.setQueriesData<PageResponse<NotificationDTO>>({ queryKey: key }, (current) =>
        current
          ? {
              ...current,
              items: current.items.map((item) =>
                item.id === notification.id ? { ...item, read: true } : item,
              ),
            }
          : current,
      );
      return { previous };
    },
    onError: (error, _notification, context) => {
      if (context?.previous) {
        context.previous.forEach(([key, value]) => queryClient.setQueryData(key, value));
      }
      toast.error(extractErrorMessage(error));
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: notificationKeys.user(userId) });
    },
  });
}
