import { beforeEach, describe, expect, it, vi } from "vitest";
import apiClient from "@/lib/api-client";
import { usersApi } from "./users-api";

vi.mock("@/lib/api-client", () => ({
  default: {
    get: vi.fn(),
    post: vi.fn(),
    patch: vi.fn(),
    delete: vi.fn(),
  },
}));

const mockedApiClient = vi.mocked(apiClient);

describe("usersApi", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("uses admin user management endpoints", async () => {
    mockedApiClient.get.mockResolvedValue({ data: { data: [] } });
    mockedApiClient.post.mockResolvedValue({ data: { data: {} } });
    mockedApiClient.patch.mockResolvedValue({ data: { data: {} } });
    mockedApiClient.delete.mockResolvedValue({ data: { data: {} } });

    await usersApi.list();
    await usersApi.createAccount({
      name: "Admin",
      email: "admin@example.com",
      password: "Password1",
      role: "admin",
    });
    await usersApi.changeRole(7, { role: "hr" });
    await usersApi.changeStatus(7, { active: false, status: "DISABLED" });
    await usersApi.delete(7);

    expect(mockedApiClient.get).toHaveBeenCalledWith("/users", {
      params: undefined,
    });
    expect(mockedApiClient.post).toHaveBeenCalledWith(
      "/users/admin/accounts",
      expect.objectContaining({ role: "admin" }),
    );
    expect(mockedApiClient.patch).toHaveBeenNthCalledWith(
      1,
      "/users/7/role",
      { role: "hr" },
    );
    expect(mockedApiClient.patch).toHaveBeenNthCalledWith(
      2,
      "/users/7/status",
      { active: false, status: "DISABLED" },
    );
    expect(mockedApiClient.delete).toHaveBeenCalledWith("/users/7");
  });
});
