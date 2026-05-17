import apiClient from "@/lib/api-client";
import type { ApiResponse, PageResponse } from "@/types/api";
import type {
  ProfileDTO,
  ProfileFormValues,
  ProfileSearchParams,
} from "@/types/profile";

function cleanProfilePayload(input: ProfileFormValues) {
  return {
    title: input.title,
    typeProfile: input.typeProfile,
    objective: input.objective,
    education: input.education,
    workExperience: input.workExperience,
    skills: input.skills,
    contact: input.contact,
  };
}

const repeatedIdsSerializer = {
  serialize: (params: Record<string, unknown>) => {
    const searchParams = new URLSearchParams();
    const values = params.ids as number[] | undefined;
    values?.forEach((id) => searchParams.append("ids", String(id)));
    return searchParams.toString();
  },
};

export const profilesApi = {
  async me() {
    const response = await apiClient.get<ApiResponse<ProfileDTO>>(
      "/profiles/me",
    );
    return response.data;
  },

  async createMe(input: ProfileFormValues) {
    const response = await apiClient.post<ApiResponse<ProfileDTO>>(
      "/profiles/me",
      cleanProfilePayload(input),
    );
    return response.data;
  },

  async updateMe(input: ProfileFormValues) {
    const response = await apiClient.patch<ApiResponse<ProfileDTO>>(
      "/profiles/me",
      cleanProfilePayload(input),
    );
    return response.data;
  },

  async updateAvatar(file: File) {
    const formData = new FormData();
    formData.append("image", file);
    const response = await apiClient.post<ApiResponse<ProfileDTO>>(
      "/profiles/me/avatar",
      formData,
      { headers: { "Content-Type": "multipart/form-data" } },
    );
    return response.data;
  },

  async deleteMe() {
    const response = await apiClient.delete<ApiResponse<void>>("/profiles/me");
    return response.data;
  },

  async search(params: ProfileSearchParams) {
    const response = await apiClient.get<ApiResponse<PageResponse<ProfileDTO>>>(
      "/profiles",
      {
        params: {
          type: params.type || undefined,
          title: params.title || undefined,
          page: params.page ?? 0,
          size: params.size ?? 20,
          sort: params.sort ?? "createdAt,desc",
        },
      },
    );
    return response.data;
  },

  async findById(id: number) {
    const response = await apiClient.get<ApiResponse<ProfileDTO>>(
      `/profiles/${id}`,
    );
    return response.data;
  },

  async findByUserId(userId: number) {
    const response = await apiClient.get<ApiResponse<ProfileDTO>>(
      `/profiles/by-user/${userId}`,
    );
    return response.data;
  },

  async batch(ids: number[]) {
    const response = await apiClient.get<ApiResponse<ProfileDTO[]>>(
      "/profiles/batch",
      { params: { ids }, paramsSerializer: repeatedIdsSerializer },
    );
    return response.data;
  },
};
