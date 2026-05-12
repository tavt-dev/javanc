import apiClient from "@/lib/api-client";
import type { ApiResponse } from "@/types/api";
import type { ProjectDTO, ProjectFormValues } from "@/types/project";

export const projectsApi = {
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
