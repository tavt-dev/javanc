import { beforeEach, describe, expect, it, vi } from "vitest";
import apiClient from "@/lib/api-client";
import { jobsApi } from "./jobs-api";

vi.mock("@/lib/api-client", () => ({
  default: {
    get: vi.fn(),
    put: vi.fn(),
  },
}));

const mockedApiClient = vi.mocked(apiClient);

describe("jobsApi", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("applies using backend query names", async () => {
    mockedApiClient.put.mockResolvedValueOnce({ data: { data: {} } });

    await jobsApi.apply({ jobId: 5, profileId: 11 });

    expect(mockedApiClient.put).toHaveBeenCalledWith(
      "/manager/user/job/apply",
      null,
      { params: { jobDTO: 5, idProfile: 11 } },
    );
  });

  it("gets pending and accepted jobs by profile id", async () => {
    mockedApiClient.get.mockResolvedValue({ data: { data: [] } });

    await jobsApi.getPendingByProfile(7);
    await jobsApi.getAcceptedByProfile(7);

    expect(mockedApiClient.get).toHaveBeenNthCalledWith(
      1,
      "/manager/user/job/getjobpending",
      { params: { id: 7 } },
    );
    expect(mockedApiClient.get).toHaveBeenNthCalledWith(
      2,
      "/manager/user/job/getjobaccepted",
      { params: { id: 7 } },
    );
  });
});
