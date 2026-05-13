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
    await usersApi.me();
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
    expect(mockedApiClient.get).toHaveBeenCalledWith("/users/me");
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

  it("uses role request endpoints", async () => {
    mockedApiClient.get.mockResolvedValue({ data: { data: [] } });
    mockedApiClient.post.mockResolvedValue({ data: { data: { id: 1 } } });
    mockedApiClient.patch.mockResolvedValue({ data: { data: { id: 1 } } });

    await usersApi.requestManagerUpgrade({ reason: "Ready to manage" });
    await usersApi.myRoleRequests();
    await usersApi.adminRoleRequests({ status: "PENDING_SYSADMIN" });
    await usersApi.approveRoleRequest(1);
    await usersApi.rejectRoleRequest(2, { adminNote: "Need more history" });
    await usersApi.requestHrPromotion({
      targetUserId: 7,
      companyId: 4,
      companyName: "Acme",
    });
    await usersApi.myHrPromotions();
    await usersApi.findRoleRequest(3);
    await usersApi.acceptHrPromotion(4);
    await usersApi.rejectHrPromotion(5);
    await usersApi.leaveHr();

    expect(mockedApiClient.post).toHaveBeenNthCalledWith(
      1,
      "/users/me/manager-upgrade-requests",
      { reason: "Ready to manage" },
    );
    expect(mockedApiClient.get).toHaveBeenCalledWith("/users/me/role-requests");
    expect(mockedApiClient.get).toHaveBeenCalledWith(
      "/users/admin/role-requests",
      { params: { status: "PENDING_SYSADMIN" } },
    );
    expect(mockedApiClient.patch).toHaveBeenCalledWith(
      "/users/admin/role-requests/1/approve",
    );
    expect(mockedApiClient.patch).toHaveBeenCalledWith(
      "/users/admin/role-requests/2/reject",
      { adminNote: "Need more history" },
    );
    expect(mockedApiClient.post).toHaveBeenNthCalledWith(
      2,
      "/users/manager/hr-promotion-requests",
      { targetUserId: 7, companyId: 4, companyName: "Acme" },
    );
    expect(mockedApiClient.get).toHaveBeenCalledWith(
      "/users/me/hr-promotion-requests",
    );
    expect(mockedApiClient.get).toHaveBeenCalledWith("/users/role-requests/3");
    expect(mockedApiClient.patch).toHaveBeenCalledWith(
      "/users/me/hr-promotion-requests/4/accept",
    );
    expect(mockedApiClient.patch).toHaveBeenCalledWith(
      "/users/me/hr-promotion-requests/5/reject",
    );
    expect(mockedApiClient.patch).toHaveBeenCalledWith("/users/me/leave-hr");
  });
});
