import { beforeEach, describe, expect, it, vi } from "vitest";
import apiClient from "@/lib/api-client";
import { companiesApi } from "./companies-api";

vi.mock("@/lib/api-client", () => ({
  default: {
    get: vi.fn(),
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
});
