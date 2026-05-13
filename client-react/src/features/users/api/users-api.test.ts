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
    mockedApiClient.post.mockResolvedValue({
      data: { data: { id: 7, active: true } },
    });
    mockedApiClient.patch.mockResolvedValue({
      data: { data: { id: 7, active: true } },
    });
    mockedApiClient.delete.mockResolvedValue({
      data: { data: { id: 7, active: false } },
    });

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
      paramsSerializer: expect.any(Object),
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

  it("normalizes user DTO aliases and serializes ids for backend query params", async () => {
    mockedApiClient.get.mockResolvedValue({
      data: {
        data: [
          {
            id: 11,
            name: "Alias User",
            email: "alias@example.com",
            employeeId: "EMP-11",
            role: "admin",
            isActive: true,
          },
        ],
      },
    });

    const response = await usersApi.list([11, 12]);
    const config = mockedApiClient.get.mock.calls[0]?.[1];
    const serializer = config?.paramsSerializer as
      | { serialize?: (params: Record<string, unknown>) => string }
      | undefined;

    expect(response.data[0]).toMatchObject({
      idEmployee: "EMP-11",
      active: true,
    });
    expect(serializer?.serialize?.({ ids: [11, 12] })).toBe("ids=11&ids=12");
  });
});
