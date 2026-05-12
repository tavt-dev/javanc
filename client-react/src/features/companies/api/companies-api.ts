import apiClient from "@/lib/api-client";
import type { ApiResponse } from "@/types/api";
import type { CompanyDTO } from "@/types/company";

export const companiesApi = {
  async getAll() {
    const response = await apiClient.get<ApiResponse<CompanyDTO[]>>(
      "/manager/user/company/getcompany",
    );
    return response.data;
  },

  async getByType(type: string) {
    const response = await apiClient.get<ApiResponse<CompanyDTO[]>>(
      "/manager/user/company/getcompanybytype",
      { params: { type } },
    );
    return response.data;
  },

  async getById(companyId: number) {
    const response = await apiClient.get<ApiResponse<CompanyDTO>>(
      "/manager/user/company/getbyid",
      { params: { id: companyId } },
    );
    return response.data;
  },
};
