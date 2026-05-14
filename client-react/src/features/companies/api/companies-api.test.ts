import { beforeEach, describe, expect, it, vi } from "vitest";
import apiClient from "@/lib/api-client";
import { companiesApi } from "./companies-api";

vi.mock("@/lib/api-client", () => ({
  default: {
    get: vi.fn(),
    patch: vi.fn(),
    post: vi.fn(),
    put: vi.fn(),
  },
}));

const mockedApiClient = vi.mocked(apiClient);

describe("companiesApi", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("gets company detail with id query param", async () => {
    mockedApiClient.get.mockResolvedValue({ data: { data: {} } });

    await companiesApi.getById(9);
    await companiesApi.myManagedCompany();

    expect(mockedApiClient.get).toHaveBeenNthCalledWith(
      1,
      "/manager/user/company/getbyid",
      { params: { id: 9 } },
    );
    expect(mockedApiClient.get).toHaveBeenNthCalledWith(
      2,
      "/manager/manager/company/me",
    );
  });

  it("creates company using multipart and image field", async () => {
    mockedApiClient.post.mockResolvedValueOnce({ data: { data: {} } });
    const file = new File(["x"], "company.png", { type: "image/png" });

    await companiesApi.create({ name: "Acme", image: file });

    const formData = mockedApiClient.post.mock.calls[0]?.[1] as FormData;
    expect(mockedApiClient.post).toHaveBeenCalledWith(
      "/manager/admin/company/create",
      expect.any(FormData),
      { headers: { "Content-Type": "multipart/form-data" } },
    );
    expect(formData.get("name")).toBe("Acme");
    expect(formData.get("image")).toBe(file);
  });

  it("assigns HR and manager accounts through backend typo endpoints", async () => {
    mockedApiClient.put.mockResolvedValue({ data: { data: {} } });
    const account = {
      name: "Lead",
      email: "lead@example.com",
      password: "Password1",
      confirmPassword: "Password1",
    };

    await companiesApi.createHrAccountAndAssign(4, account);
    await companiesApi.createManagerAccountAndAssign(5, account);

    expect(mockedApiClient.put).toHaveBeenNthCalledWith(
      1,
      "/manager/manager/sethrtocompany",
      {
        name: "Lead",
        email: "lead@example.com",
        password: "Password1",
        employeeId: undefined,
      },
      { params: { idCompany: 4 } },
    );
    expect(mockedApiClient.put).toHaveBeenNthCalledWith(
      2,
      "/manager/manager/setmaanagertocompany",
      {
        name: "Lead",
        email: "lead@example.com",
        password: "Password1",
        employeeId: undefined,
      },
      { params: { idCompany: 5 } },
    );
  });

  it("uses HR promotion and leave endpoints", async () => {
    mockedApiClient.get.mockResolvedValueOnce({ data: { data: [] } });
    mockedApiClient.post.mockResolvedValueOnce({ data: { data: { id: 3 } } });
    mockedApiClient.put.mockResolvedValueOnce({ data: { data: { id: 4 } } });
    mockedApiClient.patch.mockResolvedValue({ data: { data: { id: 4 } } });

    await companiesApi.hrCandidates({ query: "ana", page: 1, size: 20 });
    await companiesApi.requestHrPromotion(7);
    await companiesApi.promoteUserToHr(8, 4);
    await companiesApi.acceptHrPromotion(9);
    await companiesApi.leaveHr();

    expect(mockedApiClient.get).toHaveBeenCalledWith(
      "/manager/manager/hr-candidates",
      { params: { query: "ana", page: 1, size: 20 } },
    );
    expect(mockedApiClient.post).toHaveBeenCalledWith(
      "/manager/manager/hr-promotions",
      null,
      { params: { targetUserId: 7 } },
    );
    expect(mockedApiClient.put).toHaveBeenCalledWith(
      "/manager/manager/promotehrtocompany",
      null,
      { params: { idUser: 8, idCompany: 4 } },
    );
    expect(mockedApiClient.patch).toHaveBeenCalledWith(
      "/manager/user/hr-promotions/9/accept",
    );
    expect(mockedApiClient.patch).toHaveBeenCalledWith("/manager/hr/leave");
  });

  it("normalizes relationship arrays and trims internal account payloads", async () => {
    mockedApiClient.get.mockResolvedValueOnce({
      data: { data: { id: 9, name: "Acme" } },
    });
    mockedApiClient.put.mockResolvedValueOnce({
      data: { data: { id: 9, name: "Acme" } },
    });

    const company = await companiesApi.getById(9);
    await companiesApi.createHrAccountAndAssign(9, {
      name: " Lead ",
      email: " lead@example.com ",
      password: "Password1",
      confirmPassword: "Password1",
      employeeId: " HR-1 ",
    });

    expect(company.data.idHR).toEqual([]);
    expect(company.data.idJobs).toEqual([]);
    expect(mockedApiClient.put).toHaveBeenCalledWith(
      "/manager/manager/sethrtocompany",
      {
        name: "Lead",
        email: "lead@example.com",
        password: "Password1",
        employeeId: "HR-1",
      },
      { params: { idCompany: 9 } },
    );
  });
});
