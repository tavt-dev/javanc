import { describe, expect, it } from "vitest";
import {
  getUnreadCount,
  sortNotificationsNewestFirst,
  toReadNotification,
} from "@/features/notifications/utils/notification-utils";
import type { NotificationDTO } from "@/types/notification";

const notifications: NotificationDTO[] = [
  {
    id: 1,
    message: "Old",
    createAt: "2026-05-11T10:00:00",
    read: false,
    idUser: 1,
  },
  {
    id: 2,
    message: "New",
    createAt: "2026-05-12T10:00:00",
    read: true,
    idUser: 1,
  },
];

describe("notification-utils", () => {
  it("sorts newest first", () => {
    expect(sortNotificationsNewestFirst(notifications).map((item) => item.id))
      .toEqual([2, 1]);
  });

  it("counts unread notifications", () => {
    expect(getUnreadCount(notifications)).toBe(1);
  });

  it("preserves notification fields when marking read", () => {
    expect(toReadNotification(notifications[0]!)).toEqual({
      ...notifications[0]!,
      read: true,
    });
  });
});
