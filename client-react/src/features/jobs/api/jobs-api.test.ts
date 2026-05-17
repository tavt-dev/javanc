import { beforeEach, describe, expect, it, vi } from "vitest";
import apiClient from "@/lib/api-client";
import type { JobDTO } from "@/types/job";
import { jobsApi } from "./jobs-api";

vi.mock("@/lib/api-client", () => ({
  default: {
    get: vi.fn(),
    post: vi.fn(),
    put: vi.fn(),
  },
}));

const mockedApiClient = vi.mocked(apiClient);

function page<T>(items: T[]) {
  return {
    items,
    page: 0,
    size: 20,
    totalElements: items.length,
    totalPages: items.length ? 1 : 0,
    hasNext: false,
    hasPrevious: false,
  };
}

describe("jobsApi", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("applies using backend query names", async () => {
    mockedApiClient.put.mockResolvedValueOnce({ data: { data: {} } });
    mockedApiClient.post.mockResolvedValue({ data: { data: {} } });
    mockedApiClient.get.mockResolvedValueOnce({ data: { data: "pending" } });

    await jobsApi.apply({ jobId: 5, profileId: 11 });
    await jobsApi.applyCurrentUser(5);
    await jobsApi.leaveCurrentUser(5);
    await jobsApi.applicationStatus(5);

    expect(mockedApiClient.put).toHaveBeenCalledWith(
      "/manager/user/job/apply",
      null,
      { params: { jobDTO: 5, idProfile: 11 } },
    );
    expect(mockedApiClient.post).toHaveBeenNthCalledWith(
      1,
      "/manager/user/jobs/5/applications",
    );
    expect(mockedApiClient.post).toHaveBeenNthCalledWith(
      2,
      "/manager/user/jobs/5/leave",
    );
    expect(mockedApiClient.get).toHaveBeenCalledWith(
      "/manager/user/jobs/5/application-status",
    );
  });

  it("gets pending and accepted jobs by profile id", async () => {
    mockedApiClient.get.mockResolvedValue({ data: { data: page([]) } });

    await jobsApi.getPendingByProfile(7);
    await jobsApi.getAcceptedByProfile(7);

    expect(mockedApiClient.get).toHaveBeenNthCalledWith(
      1,
      "/manager/user/job/getjobpending",
      { params: { id: 7, page: 0, size: 20, sort: "id,desc" } },
    );
    expect(mockedApiClient.get).toHaveBeenNthCalledWith(
      2,
      "/manager/user/job/getjobaccepted",
      { params: { id: 7, page: 0, size: 20, sort: "id,desc" } },
    );
  });

  it("creates, updates, deletes, accepts, and rejects through HR endpoints", async () => {
    const job: JobDTO = { id: 3, title: "Java", idCompany: 8 };
    mockedApiClient.post.mockResolvedValue({ data: { data: job } });
    mockedApiClient.put.mockResolvedValue({ data: { data: job } });

    await jobsApi.create(job);
    await jobsApi.update(job);
    await jobsApi.delete(3);
    await jobsApi.accept({ jobId: 3, profileId: 9 });
    await jobsApi.reject({ jobId: 3, profileId: 9 });

    expect(mockedApiClient.post).toHaveBeenNthCalledWith(
      1,
      "/manager/hr/job/create",
      job,
    );
    expect(mockedApiClient.post).toHaveBeenNthCalledWith(
      2,
      "/manager/hr/job/update",
      job,
    );
    expect(mockedApiClient.post).toHaveBeenNthCalledWith(
      3,
      "/manager/hr/job/delete",
      null,
      { params: { id: 3 } },
    );
    expect(mockedApiClient.put).toHaveBeenNthCalledWith(
      1,
      "/manager/hr/job/accept",
      null,
      { params: { jobDTO: 3, idProfile: 9 } },
    );
    expect(mockedApiClient.put).toHaveBeenNthCalledWith(
      2,
      "/manager/hr/job/reject",
      null,
      { params: { jobDTO: 3, idProfile: 9 } },
    );
  });

  it("normalizes legacy applicant arrays from backend responses", async () => {
    mockedApiClient.get.mockResolvedValueOnce({
      data: {
        data: page([{ id: 7, title: "Java", idCompany: 8 }]),
      },
    });

    const response = await jobsApi.getAll();

    expect(response.data.items[0]).toMatchObject({
      idProfiePending: [],
      idProfile: [],
    });
  });
});
