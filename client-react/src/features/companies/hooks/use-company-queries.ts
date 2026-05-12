import { useQuery } from "@tanstack/react-query";
import { companiesApi } from "@/features/companies/api/companies-api";

export const companyKeys = {
  all: ["companies", "all"] as const,
  type: (type: string) => ["companies", "type", type] as const,
  detail: (companyId: number) => ["companies", "detail", companyId] as const,
};

export function useCompaniesQuery() {
  return useQuery({
    queryKey: companyKeys.all,
    queryFn: async () => (await companiesApi.getAll()).data,
  });
}

export function useCompanyByTypeQuery(type?: string) {
  return useQuery({
    queryKey: type ? companyKeys.type(type) : ["companies", "type", "missing"],
    queryFn: async () => {
      if (!type) return [];
      return (await companiesApi.getByType(type)).data;
    },
    enabled: Boolean(type),
  });
}

export function useCompanyDetailQuery(companyId: number | null) {
  return useQuery({
    queryKey: companyId
      ? companyKeys.detail(companyId)
      : ["companies", "detail", "invalid"],
    queryFn: async () => {
      if (!companyId) throw new Error("Invalid company id");
      return (await companiesApi.getById(companyId)).data;
    },
    enabled: Boolean(companyId),
  });
}
