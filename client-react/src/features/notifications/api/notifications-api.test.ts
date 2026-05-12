import { beforeEach, describe, expect, it, vi } from "vitest";
import apiClient from "@/lib/api-client";
import { notificationsApi } from "./notifications-api";
import type { NotificationDTO } from "@/types/notification";

vi.mock("@/lib/api-client", () => ({
  default: {
    get: vi.fn(),
    post: vi.fn(),
  },
}));

const mockedApiClient = vi.mocked(apiClient);

describe("notificationsApi", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("finds notifications by user id", async () => {
    mockedApiClient.get.mockResolvedValueOnce({ data: { data: [] } });

    await notificationsApi.findByUser(3);

    expect(mockedApiClient.get).toHaveBeenCalledWith(
      "/notification/user/findByUser",
      { params: { userId: 3 } },
    );
  });

  it("posts full notification payload when marking read", async () => {
    mockedApiClient.post.mockResolvedValueOnce({ data: { data: {} } });
    const notification: NotificationDTO = {
      id: 4,
      message: "Accepted",
      read: false,
      idUser: 3,
      createAt: "2026-05-12T10:00:00",
      url: "/jobs/1",
    };

    await notificationsApi.markRead(notification);

    expect(mockedApiClient.post).toHaveBeenCalledWith("/notification/update", {
      ...notification,
      read: true,
    });
  });
});
