import { useMutation, useQuery } from "@tanstack/react-query";
import { toast } from "sonner";
import { extractErrorMessage } from "@/lib/api-error";
import { queryClient } from "@/lib/query-client";
import { companiesApi } from "@/features/companies/api/companies-api";
import { usersApi } from "@/features/users/api/users-api";
import { userKeys } from "@/features/users/hooks/use-user-queries";
import { useAuthStore } from "@/stores/auth-store";
import type { CompanyDTO, CompanyFormValues } from "@/types/company";
import type { InternalAccountFormValues } from "@/types/user";

export const companyKeys = {
  all: ["companies", "all"] as const,
  type: (type: string) => ["companies", "type", type] as const,
  detail: (companyId: number) => ["companies", "detail", companyId] as const,
  me: ["companies", "manager", "me"] as const,
  manager: (managerId: number) => ["companies", "manager", managerId] as const,
  hr: (hrId: number) => ["companies", "hr", hrId] as const,
  hrCandidates: (query: string) => ["companies", "hr-candidates", query] as const,
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

export function useManagerCompanyQuery(managerId?: number | null) {
  return useQuery({
    queryKey: managerId
      ? companyKeys.manager(managerId)
      : ["companies", "manager", "missing"],
    queryFn: async () => {
      if (!managerId) throw new Error("Missing manager id");
      return (await companiesApi.getByManagerId(managerId)).data;
    },
    enabled: Boolean(managerId),
    retry: false,
  });
}

export function useMyManagedCompanyQuery(enabled = true) {
  return useQuery({
    queryKey: companyKeys.me,
    queryFn: async () => (await companiesApi.myManagedCompany()).data,
    enabled,
    retry: false,
  });
}

export function useHrCompanyQuery(hrId?: number | null) {
  return useQuery({
    queryKey: hrId ? companyKeys.hr(hrId) : ["companies", "hr", "missing"],
    queryFn: async () => {
      if (!hrId) throw new Error("Missing HR id");
      return (await companiesApi.findByHrId(hrId)).data;
    },
    enabled: Boolean(hrId),
    retry: false,
  });
}

export function useHrCandidatesQuery(query: string, enabled = true) {
  return useQuery({
    queryKey: companyKeys.hrCandidates(query),
    queryFn: async () =>
      (await companiesApi.hrCandidates({ query, page: 0, size: 10 })).data ?? [],
    enabled,
  });
}

function invalidateCompany(company?: CompanyDTO) {
  queryClient.invalidateQueries({ queryKey: companyKeys.all });
  if (company?.id) {
    queryClient.invalidateQueries({ queryKey: companyKeys.detail(company.id) });
    queryClient.invalidateQueries({ queryKey: ["jobs", "company", company.id] });
  }
  if (company?.idManager) {
    queryClient.invalidateQueries({
      queryKey: companyKeys.manager(company.idManager),
    });
  }
  queryClient.invalidateQueries({ queryKey: companyKeys.me });
  company?.idHR?.forEach((hrId) => {
    queryClient.invalidateQueries({ queryKey: companyKeys.hr(hrId) });
  });
}

export function useCreateCompanyMutation() {
  return useMutation({
    mutationFn: (input: CompanyFormValues) => companiesApi.create(input),
    onSuccess: (response) => {
      invalidateCompany(response.data);
      toast.success("Company created");
    },
    onError: (error) => toast.error(extractErrorMessage(error)),
  });
}

export function useUpdateCompanyMutation() {
  return useMutation({
    mutationFn: (company: CompanyDTO) => companiesApi.update(company),
    onSuccess: (response) => {
      invalidateCompany(response.data);
      toast.success("Company updated");
    },
    onError: (error) => toast.error(extractErrorMessage(error)),
  });
}

export function useDeleteCompanyMutation() {
  return useMutation({
    mutationFn: (companyId: number) => companiesApi.delete(companyId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: companyKeys.all });
      toast.success("Company deleted");
    },
    onError: (error) => toast.error(extractErrorMessage(error)),
  });
}

export function useCreateHrAccountAndAssignMutation(companyId: number) {
  return useMutation({
    mutationFn: (input: InternalAccountFormValues) =>
      companiesApi.createHrAccountAndAssign(companyId, input),
    onSuccess: (response) => {
      invalidateCompany(response.data);
      queryClient.invalidateQueries({ queryKey: ["users"] });
      toast.success("HR account created and assigned");
    },
    onError: (error) => toast.error(extractErrorMessage(error)),
  });
}

export function useCreateManagerAccountAndAssignMutation(companyId: number) {
  return useMutation({
    mutationFn: (input: InternalAccountFormValues) =>
      companiesApi.createManagerAccountAndAssign(companyId, input),
    onSuccess: (response) => {
      invalidateCompany(response.data);
      queryClient.invalidateQueries({ queryKey: ["users"] });
      toast.success("Manager account created and assigned");
    },
    onError: (error) => toast.error(extractErrorMessage(error)),
  });
}

export function useRequestHrPromotionMutation() {
  return useMutation({
    mutationFn: (targetUserId: number) =>
      companiesApi.requestHrPromotion(targetUserId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["users", "role-requests"] });
      queryClient.invalidateQueries({ queryKey: ["notifications"] });
      toast.success("HR invitation sent");
    },
    onError: (error) => toast.error(extractErrorMessage(error)),
  });
}

export function usePromoteUserToHrMutation(companyId: number) {
  return useMutation({
    mutationFn: (userId: number) => companiesApi.promoteUserToHr(userId, companyId),
    onSuccess: (response) => {
      invalidateCompany(response.data);
      queryClient.invalidateQueries({ queryKey: ["users"] });
      toast.success("HR promotion requested");
    },
    onError: (error) => toast.error(extractErrorMessage(error)),
  });
}

export function useAcceptHrPromotionWithCompanyMutation() {
  return useMutation({
    mutationFn: (requestId: number) => companiesApi.acceptHrPromotion(requestId),
    onSuccess: async (response) => {
      invalidateCompany(response.data);
      queryClient.invalidateQueries({ queryKey: ["users", "role-requests"] });
      queryClient.invalidateQueries({ queryKey: ["notifications"] });
      try {
        const currentUser = await usersApi.me();
        useAuthStore.getState().updateUser(currentUser.data);
        queryClient.setQueryData(userKeys.me, currentUser.data);
      } catch {
        queryClient.invalidateQueries({ queryKey: userKeys.me });
      }
      toast.success("HR invitation accepted");
    },
    onError: (error) => toast.error(extractErrorMessage(error)),
  });
}

export function useLeaveHrCompanyMutation() {
  return useMutation({
    mutationFn: () => companiesApi.leaveHr(),
    onSuccess: async (response) => {
      invalidateCompany(response.data);
      queryClient.invalidateQueries({ queryKey: ["users"] });
      try {
        const currentUser = await usersApi.me();
        useAuthStore.getState().updateUser(currentUser.data);
        queryClient.setQueryData(userKeys.me, currentUser.data);
      } catch {
        queryClient.invalidateQueries({ queryKey: userKeys.me });
      }
      toast.success("You left the HR role");
    },
    onError: (error) => toast.error(extractErrorMessage(error)),
  });
}
