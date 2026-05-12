import { beforeEach, describe, expect, it, vi } from "vitest";
import apiClient from "@/lib/api-client";
import { companiesApi } from "./companies-api";

vi.mock("@/lib/api-client", () => ({
  default: {
    get: vi.fn(),
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
    mockedApiClient.get.mockResolvedValueOnce({ data: { data: {} } });

    await companiesApi.getById(9);

    expect(mockedApiClient.get).toHaveBeenCalledWith(
      "/manager/user/company/getbyid",
      { params: { id: 9 } },
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
});
