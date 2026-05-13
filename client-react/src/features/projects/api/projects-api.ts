import apiClient from "@/lib/api-client";
import type { ApiResponse } from "@/types/api";
import type { ProfileDTO } from "@/types/profile";
import type { ProjectDTO, ProjectFormValues } from "@/types/project";

export const projectsApi = {
  async myProjects() {
    const response = await apiClient.get<ApiResponse<ProjectDTO[]>>(
      "/project/user/projects",
    );
    return response.data;
  },

  async myProject(projectId: number) {
    const response = await apiClient.get<ApiResponse<ProjectDTO>>(
      `/project/user/projects/${projectId}`,
    );
    return response.data;
  },

  async createMyProject(input: ProjectFormValues) {
    const response = await apiClient.post<ApiResponse<ProjectDTO>>(
      "/project/user/projects",
      input,
    );
    return response.data;
  },

  async updateMyProject(projectId: number, input: ProjectFormValues) {
    const response = await apiClient.patch<ApiResponse<ProjectDTO>>(
      `/project/user/projects/${projectId}`,
      input,
    );
    return response.data;
  },

  async deleteMyProject(projectId: number) {
    const response = await apiClient.delete<ApiResponse<void>>(
      `/project/user/projects/${projectId}`,
    );
    return response.data;
  },

  async profilesCompatibility() {
    const response = await apiClient.get<ApiResponse<ProfileDTO[]>>(
      "/project/user/getProfile",
    );
    return response.data;
  },

  async imageCompatibilityStatus() {
    const response = await apiClient.get<ApiResponse<string>>(
      "/project/user/get1",
    );
    return response.data;
  },

  async getByProfile(profileId: number) {
    const response = await apiClient.get<ApiResponse<ProjectDTO[]>>(
      "/project/user/getProject",
      { params: { id: profileId } },
    );
    return response.data;
  },

  async save(input: ProjectFormValues & { idProfile: number }) {
    const response = await apiClient.post<ApiResponse<ProjectDTO>>(
      "/project/user/save",
      input,
    );
    return response.data;
  },

  async update(input: ProjectFormValues & { id: number; idProfile: number }) {
    const response = await apiClient.post<ApiResponse<ProjectDTO>>(
      "/project/user/update",
      input,
    );
    return response.data;
  },
};
