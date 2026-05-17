import apiClient from "@/lib/api-client";
import type { ApiResponse, PageParams, PageResponse } from "@/types/api";
import type { JobDTO } from "@/types/job";

function normalizeJob(job: JobDTO): JobDTO {
  return {
    ...job,
    idProfiePending: job.idProfiePending ?? [],
    idProfile: job.idProfile ?? [],
  };
}

function normalizeJobResponse(response: ApiResponse<JobDTO>) {
  return { ...response, data: normalizeJob(response.data) };
}

function normalizeJobsResponse(response: ApiResponse<PageResponse<JobDTO>>) {
  return {
    ...response,
    data: { ...response.data, items: (response.data?.items ?? []).map(normalizeJob) },
  };
}

export const jobsApi = {
  async getAll(params: PageParams & { query?: string; type?: string; companyId?: string; openOnly?: boolean } = {}) {
    const response = await apiClient.get<ApiResponse<PageResponse<JobDTO>>>(
      "/manager/user/job/getall",
      {
        params: {
          query: params.query || undefined,
          type: params.type || undefined,
          companyId: params.companyId || undefined,
          openOnly: params.openOnly || undefined,
          page: params.page ?? 0,
          size: params.size ?? 20,
          sort: params.sort ?? "id,desc",
        },
      },
    );
    return normalizeJobsResponse(response.data);
  },

  async getNewForProfile(
    profileId: number,
    params: PageParams & { query?: string; type?: string; companyId?: string; openOnly?: boolean } = {},
  ) {
    const response = await apiClient.get<ApiResponse<PageResponse<JobDTO>>>(
      "/manager/user/job/getnewjob",
      {
        params: {
          id: profileId,
          query: params.query || undefined,
          type: params.type || undefined,
          companyId: params.companyId || undefined,
          openOnly: params.openOnly || undefined,
          page: params.page ?? 0,
          size: params.size ?? 20,
          sort: params.sort ?? "id,desc",
        },
      },
    );
    return normalizeJobsResponse(response.data);
  },

  async findById(jobId: number) {
    const response = await apiClient.get<ApiResponse<JobDTO>>(
      "/manager/user/job/findbyid",
      { params: { id: jobId } },
    );
    return response.data;
  },

  async getByCompany(companyId: number, params: PageParams = {}) {
    const response = await apiClient.get<ApiResponse<PageResponse<JobDTO>>>(
      "/manager/user/job/getjobbycompany",
      { params: { id: companyId, page: params.page ?? 0, size: params.size ?? 20, sort: params.sort ?? "id,desc" } },
    );
    return normalizeJobsResponse(response.data);
  },

  async getPendingByProfile(profileId: number, params: PageParams = {}) {
    const response = await apiClient.get<ApiResponse<PageResponse<JobDTO>>>(
      "/manager/user/job/getjobpending",
      { params: { id: profileId, page: params.page ?? 0, size: params.size ?? 20, sort: params.sort ?? "id,desc" } },
    );
    return normalizeJobsResponse(response.data);
  },

  async getAcceptedByProfile(profileId: number, params: PageParams = {}) {
    const response = await apiClient.get<ApiResponse<PageResponse<JobDTO>>>(
      "/manager/user/job/getjobaccepted",
      { params: { id: profileId, page: params.page ?? 0, size: params.size ?? 20, sort: params.sort ?? "id,desc" } },
    );
    return normalizeJobsResponse(response.data);
  },

  async apply({
    jobId,
    profileId,
  }: {
    jobId: number;
    profileId: number;
  }) {
    const response = await apiClient.put<ApiResponse<JobDTO>>(
      "/manager/user/job/apply",
      null,
      { params: { jobDTO: jobId, idProfile: profileId } },
    );
    return normalizeJobResponse(response.data);
  },

  async applyCurrentUser(jobId: number) {
    const response = await apiClient.post<ApiResponse<JobDTO>>(
      `/manager/user/jobs/${jobId}/applications`,
    );
    return normalizeJobResponse(response.data);
  },

  async leaveCurrentUser(jobId: number) {
    const response = await apiClient.post<ApiResponse<JobDTO>>(
      `/manager/user/jobs/${jobId}/leave`,
    );
    return normalizeJobResponse(response.data);
  },

  async applicationStatus(jobId: number) {
    const response = await apiClient.get<ApiResponse<string>>(
      `/manager/user/jobs/${jobId}/application-status`,
    );
    return response.data;
  },

  async create(job: JobDTO) {
    const response = await apiClient.post<ApiResponse<JobDTO>>(
      "/manager/hr/job/create",
      job,
    );
    return normalizeJobResponse(response.data);
  },

  async update(job: JobDTO) {
    const response = await apiClient.post<ApiResponse<JobDTO>>(
      "/manager/hr/job/update",
      job,
    );
    return normalizeJobResponse(response.data);
  },

  async delete(jobId: number) {
    const response = await apiClient.post<ApiResponse<string>>(
      "/manager/hr/job/delete",
      null,
      { params: { id: jobId } },
    );
    return response.data;
  },

  async accept({
    jobId,
    profileId,
  }: {
    jobId: number;
    profileId: number;
  }) {
    const response = await apiClient.put<ApiResponse<JobDTO>>(
      "/manager/hr/job/accept",
      null,
      { params: { jobDTO: jobId, idProfile: profileId } },
    );
    return response.data;
  },

  async reject({
    jobId,
    profileId,
  }: {
    jobId: number;
    profileId: number;
  }) {
    const response = await apiClient.put<ApiResponse<JobDTO>>(
      "/manager/hr/job/reject",
      null,
      { params: { jobDTO: jobId, idProfile: profileId } },
    );
    return normalizeJobResponse(response.data);
  },
};
