import apiClient from "@/lib/api-client";
import type { ApiResponse } from "@/types/api";
import type { JobDTO } from "@/types/job";

export const jobsApi = {
  async getAll() {
    const response = await apiClient.get<ApiResponse<JobDTO[]>>(
      "/manager/user/job/getall",
    );
    return response.data;
  },

  async getNewForProfile(profileId: number) {
    const response = await apiClient.get<ApiResponse<JobDTO[]>>(
      "/manager/user/job/getnewjob",
      { params: { id: profileId } },
    );
    return response.data;
  },

  async findById(jobId: number) {
    const response = await apiClient.get<ApiResponse<JobDTO>>(
      "/manager/user/job/findbyid",
      { params: { id: jobId } },
    );
    return response.data;
  },

  async getByCompany(companyId: number) {
    const response = await apiClient.get<ApiResponse<JobDTO[]>>(
      "/manager/user/job/getjobbycompany",
      { params: { id: companyId } },
    );
    return response.data;
  },

  async getPendingByProfile(profileId: number) {
    const response = await apiClient.get<ApiResponse<JobDTO[]>>(
      "/manager/user/job/getjobpending",
      { params: { id: profileId } },
    );
    return response.data;
  },

  async getAcceptedByProfile(profileId: number) {
    const response = await apiClient.get<ApiResponse<JobDTO[]>>(
      "/manager/user/job/getjobaccepted",
      { params: { id: profileId } },
    );
    return response.data;
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
    return response.data;
  },

  async applyCurrentUser(jobId: number) {
    const response = await apiClient.post<ApiResponse<JobDTO>>(
      `/manager/user/jobs/${jobId}/applications`,
    );
    return response.data;
  },

  async leaveCurrentUser(jobId: number) {
    const response = await apiClient.post<ApiResponse<JobDTO>>(
      `/manager/user/jobs/${jobId}/leave`,
    );
    return response.data;
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
    return response.data;
  },

  async update(job: JobDTO) {
    const response = await apiClient.post<ApiResponse<JobDTO>>(
      "/manager/hr/job/update",
      job,
    );
    return response.data;
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
    return response.data;
  },
};
