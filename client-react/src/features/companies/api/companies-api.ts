import apiClient from "@/lib/api-client";
import type { ApiResponse, PageParams, PageResponse } from "@/types/api";
import type { CompanyDTO, CompanyFormValues } from "@/types/company";
import type {
  AdminUserDTO,
  InternalAccountFormValues,
  RoleRequestDTO,
} from "@/types/user";

function appendIfPresent(formData: FormData, key: string, value: unknown) {
  if (value === undefined || value === null || value === "") return;
  formData.append(key, String(value));
}

function toCompanyFormData(input: CompanyFormValues) {
  const formData = new FormData();
  appendIfPresent(formData, "name", input.name);
  appendIfPresent(formData, "type", input.type);
  appendIfPresent(formData, "description", input.description);
  appendIfPresent(formData, "street", input.street);
  appendIfPresent(formData, "email", input.email);
  appendIfPresent(formData, "phone", input.phone);
  appendIfPresent(formData, "city", input.city);
  appendIfPresent(formData, "country", input.country);
  if (input.image) formData.append("image", input.image);
  return formData;
}

function toAccountRequest(input: InternalAccountFormValues) {
  return {
    name: input.name.trim(),
    email: input.email.trim(),
    password: input.password,
    employeeId: input.employeeId?.trim() || undefined,
  };
}

function normalizeCompany(company: CompanyDTO): CompanyDTO {
  return {
    ...company,
    idHR: company.idHR ?? [],
    idJobs: company.idJobs ?? [],
  };
}

function normalizeCompanyResponse(response: ApiResponse<CompanyDTO>) {
  return { ...response, data: normalizeCompany(response.data) };
}

function normalizeCompaniesResponse(response: ApiResponse<PageResponse<CompanyDTO>>) {
  return {
    ...response,
    data: { ...response.data, items: (response.data?.items ?? []).map(normalizeCompany) },
  };
}

export const companiesApi = {
  async getAll(params: PageParams & { query?: string; type?: string; location?: string } = {}) {
    const response = await apiClient.get<ApiResponse<PageResponse<CompanyDTO>>>(
      "/manager/user/company/getcompany",
      {
        params: {
          query: params.query || undefined,
          type: params.type || undefined,
          location: params.location || undefined,
          page: params.page ?? 0,
          size: params.size ?? 20,
          sort: params.sort ?? "id,desc",
        },
      },
    );
    return normalizeCompaniesResponse(response.data);
  },

  async getByType(type: string, params: PageParams & { query?: string; location?: string } = {}) {
    const response = await apiClient.get<ApiResponse<PageResponse<CompanyDTO>>>(
      "/manager/user/company/getcompanybytype",
      {
        params: {
          type,
          query: params.query || undefined,
          location: params.location || undefined,
          page: params.page ?? 0,
          size: params.size ?? 20,
          sort: params.sort ?? "id,desc",
        },
      },
    );
    return normalizeCompaniesResponse(response.data);
  },

  async getById(companyId: number) {
    const response = await apiClient.get<ApiResponse<CompanyDTO>>(
      "/manager/user/company/getbyid",
      { params: { id: companyId } },
    );
    return normalizeCompanyResponse(response.data);
  },

  async getByManagerId(managerId: number) {
    const response = await apiClient.get<ApiResponse<CompanyDTO>>(
      "/manager/company/getcompanybyidmanager",
      { params: { managerId } },
    );
    return normalizeCompanyResponse(response.data);
  },

  async myManagedCompany() {
    const response = await apiClient.get<ApiResponse<CompanyDTO>>(
      "/manager/manager/company/me",
    );
    return normalizeCompanyResponse(response.data);
  },

  async findByHrId(hrId: number) {
    const response = await apiClient.get<ApiResponse<CompanyDTO>>(
      "/manager/hr/findByIdHr",
      { params: { id: hrId } },
    );
    return normalizeCompanyResponse(response.data);
  },

  async create(input: CompanyFormValues) {
    const response = await apiClient.post<ApiResponse<CompanyDTO>>(
      "/manager/admin/company/create",
      toCompanyFormData(input),
      { headers: { "Content-Type": "multipart/form-data" } },
    );
    return normalizeCompanyResponse(response.data);
  },

  async update(company: CompanyDTO) {
    const response = await apiClient.post<ApiResponse<CompanyDTO>>(
      "/manager/manager/company/update",
      company,
    );
    return normalizeCompanyResponse(response.data);
  },

  async delete(companyId: number) {
    const response = await apiClient.post<ApiResponse<string>>(
      "/manager/admin/company/delete",
      null,
      { params: { id: companyId } },
    );
    return response.data;
  },

  async createHrAccountAndAssign(companyId: number, input: InternalAccountFormValues) {
    const response = await apiClient.put<ApiResponse<CompanyDTO>>(
      "/manager/manager/sethrtocompany",
      toAccountRequest(input),
      { params: { idCompany: companyId } },
    );
    return normalizeCompanyResponse(response.data);
  },

  async createManagerAccountAndAssign(
    companyId: number,
    input: InternalAccountFormValues,
  ) {
    const response = await apiClient.put<ApiResponse<CompanyDTO>>(
      "/manager/manager/setmaanagertocompany",
      toAccountRequest(input),
      { params: { idCompany: companyId } },
    );
    return normalizeCompanyResponse(response.data);
  },

  async hrCandidates(params: PageParams & { query?: string }) {
    const response = await apiClient.get<ApiResponse<PageResponse<AdminUserDTO>>>(
      "/manager/manager/hr-candidates",
      {
        params: {
          query: params.query || undefined,
          page: params.page ?? 0,
          size: params.size ?? 20,
          sort: params.sort ?? "id,desc",
        },
      },
    );
    return response.data;
  },

  async requestHrPromotion(targetUserId: number) {
    const response = await apiClient.post<ApiResponse<RoleRequestDTO>>(
      "/manager/manager/hr-promotions",
      null,
      { params: { targetUserId } },
    );
    return response.data;
  },

  async promoteUserToHr(userId: number, companyId: number) {
    const response = await apiClient.put<ApiResponse<CompanyDTO>>(
      "/manager/manager/promotehrtocompany",
      null,
      { params: { idUser: userId, idCompany: companyId } },
    );
    return normalizeCompanyResponse(response.data);
  },

  async acceptHrPromotion(requestId: number) {
    const response = await apiClient.patch<ApiResponse<CompanyDTO>>(
      `/manager/user/hr-promotions/${requestId}/accept`,
    );
    return normalizeCompanyResponse(response.data);
  },

  async leaveHr() {
    const response = await apiClient.patch<ApiResponse<CompanyDTO>>(
      "/manager/hr/leave",
    );
    return normalizeCompanyResponse(response.data);
  },
};
