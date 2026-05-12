import type { NotificationDTO } from "@/types/notification";

export function sortNotificationsNewestFirst(notifications: NotificationDTO[]) {
  return [...notifications].sort(
    (a, b) =>
      new Date(b.createAt ?? 0).getTime() -
      new Date(a.createAt ?? 0).getTime(),
  );
}

export function getUnreadCount(notifications: NotificationDTO[]) {
  return notifications.filter((notification) => !notification.read).length;
}

export function toReadNotification(notification: NotificationDTO) {
  return { ...notification, read: true };
}
