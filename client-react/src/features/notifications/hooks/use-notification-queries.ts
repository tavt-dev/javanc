import { useMutation, useQuery } from "@tanstack/react-query";
import { toast } from "sonner";
import { extractErrorMessage } from "@/lib/api-error";
import { queryClient } from "@/lib/query-client";
import { notificationsApi } from "@/features/notifications/api/notifications-api";
import { sortNotificationsNewestFirst } from "@/features/notifications/utils/notification-utils";
import type { NotificationDTO } from "@/types/notification";

export const notificationKeys = {
  user: (userId: number) => ["notifications", "user", userId] as const,
};

export function useNotificationsQuery(userId?: number | null) {
  const query = useQuery({
    queryKey: userId
      ? notificationKeys.user(userId)
      : ["notifications", "user", "missing"],
    queryFn: async () => {
      if (!userId) return [];
      const response = await notificationsApi.findByUser(userId);
      return sortNotificationsNewestFirst(response.data);
    },
    enabled: Boolean(userId),
    refetchInterval: 30_000,
  });

  return {
    ...query,
    notifications: query.data ?? [],
    unreadCount: (query.data ?? []).filter((notification) => !notification.read)
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
      const previous = queryClient.getQueryData<NotificationDTO[]>(key);
      queryClient.setQueryData<NotificationDTO[]>(key, (current = []) =>
        current.map((item) =>
          item.id === notification.id ? { ...item, read: true } : item,
        ),
      );
      return { previous };
    },
    onError: (error, _notification, context) => {
      if (context?.previous) {
        queryClient.setQueryData(notificationKeys.user(userId), context.previous);
      }
      toast.error(extractErrorMessage(error));
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: notificationKeys.user(userId) });
    },
  });
}
