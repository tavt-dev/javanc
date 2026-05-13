import apiClient from "@/lib/api-client";
import { API_BASE_URL } from "@/lib/constants";
import type { ApiResponse } from "@/types/api";
import type { ImageDTO } from "@/types/image";

export const imagesApi = {
  async upload(file: File) {
    const formData = new FormData();
    formData.append("image", file);
    const response = await apiClient.post<ApiResponse<ImageDTO>>(
      "/image/save",
      formData,
      { headers: { "Content-Type": "multipart/form-data" } },
    );
    return response.data;
  },

  async preview(url: string, width = 160) {
    const response = await apiClient.get<ApiResponse<string>>(
      "/image/preview",
      { params: { url, width } },
    );
    return response.data;
  },

  async healthCheck() {
    const response = await apiClient.get<ApiResponse<string>>("/image/getAll");
    return response.data;
  },

  fileUrl(filename: string) {
    return `${API_BASE_URL}/image/files/${encodeURIComponent(filename)}`;
  },
};
