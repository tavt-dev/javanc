import { keepPreviousData, useMutation, useQuery } from "@tanstack/react-query";
import { toast } from "sonner";
import { extractErrorMessage } from "@/lib/api-error";
import { queryClient } from "@/lib/query-client";
import { jobsApi } from "@/features/jobs/api/jobs-api";
import { useTranslation } from "react-i18next";
import type { JobDTO } from "@/types/job";
import type { PageParams } from "@/types/api";

export const jobKeys = {
  all: (params?: PageParams & { query?: string; type?: string; companyId?: string; openOnly?: boolean }) =>
    ["jobs", "all", params] as const,
  newest: (
    profileId: number,
    params?: PageParams & { query?: string; type?: string; companyId?: string; openOnly?: boolean },
  ) => ["jobs", "new", profileId, params] as const,
  detail: (jobId: number) => ["jobs", "detail", jobId] as const,
  company: (companyId: number, params?: PageParams) =>
    params ? (["jobs", "company", companyId, params] as const) : (["jobs", "company", companyId] as const),
  pending: (profileId: number) => ["jobs", "pending", profileId] as const,
  accepted: (profileId: number) => ["jobs", "accepted", profileId] as const,
  applicationStatus: (jobId: number) => ["jobs", "application-status", jobId] as const,
};

export function useJobBoardQuery(
  profileId?: number | null,
  params: PageParams & { query?: string; type?: string; companyId?: string; openOnly?: boolean } = {},
) {
  return useQuery({
    queryKey: profileId ? jobKeys.newest(profileId, params) : jobKeys.all(params),
    queryFn: async () => {
      const response = profileId
        ? await jobsApi.getNewForProfile(profileId, params)
        : await jobsApi.getAll(params);
      return response.data;
    },
    placeholderData: keepPreviousData,
  });
}

export function useJobDetailQuery(jobId: number | null) {
  return useQuery({
    queryKey: jobId ? jobKeys.detail(jobId) : ["jobs", "detail", "invalid"],
    queryFn: async () => {
      if (!jobId) throw new Error("Invalid job id");
      return (await jobsApi.findById(jobId)).data;
    },
    enabled: Boolean(jobId),
  });
}

export function useJobsByCompanyQuery(companyId?: number | null, params: PageParams = {}) {
  return useQuery({
    queryKey: companyId ? jobKeys.company(companyId, params) : ["jobs", "company", "missing"],
    queryFn: async () => {
      if (!companyId) return null;
      return (await jobsApi.getByCompany(companyId, params)).data;
    },
    enabled: Boolean(companyId),
  });
}

export function usePendingJobsQuery(profileId?: number | null, params: PageParams = {}) {
  return useQuery({
    queryKey: profileId ? jobKeys.pending(profileId) : ["jobs", "pending", "missing"],
    queryFn: async () => {
      if (!profileId) return null;
      return (await jobsApi.getPendingByProfile(profileId, params)).data;
    },
    enabled: Boolean(profileId),
  });
}

export function useAcceptedJobsQuery(profileId?: number | null, params: PageParams = {}) {
  return useQuery({
    queryKey: profileId
      ? jobKeys.accepted(profileId)
      : ["jobs", "accepted", "missing"],
    queryFn: async () => {
      if (!profileId) return null;
      return (await jobsApi.getAcceptedByProfile(profileId, params)).data;
    },
    enabled: Boolean(profileId),
  });
}

export function useJobApplicationStatusQuery(
  jobId?: number | null,
  enabled = true,
) {
  return useQuery({
    queryKey: jobId
      ? jobKeys.applicationStatus(jobId)
      : ["jobs", "application-status", "missing"],
    queryFn: async () => {
      if (!jobId) return "open";
      return (await jobsApi.applicationStatus(jobId)).data;
    },
    enabled: Boolean(jobId) && enabled,
    retry: false,
  });
}

export function useApplyJobMutation(profileId: number) {
  const { t } = useTranslation();
  return useMutation({
    mutationFn: (jobId: number) => jobsApi.apply({ jobId, profileId }),
    onSuccess: (response) => {
      queryClient.invalidateQueries({ queryKey: ["jobs"] });
      queryClient.invalidateQueries({ queryKey: ["notifications"] });
      queryClient.invalidateQueries({ queryKey: jobKeys.detail(response.data.id) });
      toast.success(t("jobs.applied"));
    },
    onError: (error) => {
      toast.error(extractErrorMessage(error));
    },
  });
}

export function useApplyCurrentUserJobMutation() {
  const { t } = useTranslation();
  return useMutation({
    mutationFn: (jobId: number) => jobsApi.applyCurrentUser(jobId),
    onSuccess: (response) => {
      queryClient.invalidateQueries({ queryKey: ["jobs"] });
      queryClient.invalidateQueries({ queryKey: ["notifications"] });
      queryClient.invalidateQueries({ queryKey: jobKeys.detail(response.data.id) });
      queryClient.invalidateQueries({
        queryKey: jobKeys.applicationStatus(response.data.id),
      });
      toast.success(t("jobs.applied"));
    },
    onError: (error) => {
      toast.error(extractErrorMessage(error));
    },
  });
}

export function useLeaveCurrentUserJobMutation() {
  const { t } = useTranslation();
  return useMutation({
    mutationFn: (jobId: number) => jobsApi.leaveCurrentUser(jobId),
    onSuccess: (response) => {
      queryClient.invalidateQueries({ queryKey: ["jobs"] });
      queryClient.invalidateQueries({ queryKey: ["notifications"] });
      queryClient.invalidateQueries({ queryKey: jobKeys.detail(response.data.id) });
      queryClient.invalidateQueries({
        queryKey: jobKeys.applicationStatus(response.data.id),
      });
      toast.success(t("jobs.withdrawn"));
    },
    onError: (error) => {
      toast.error(extractErrorMessage(error));
    },
  });
}

export function useCreateJobMutation(companyId: number) {
  const { t } = useTranslation();
  return useMutation({
    mutationFn: (job: JobDTO) => jobsApi.create(job),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: jobKeys.company(companyId) });
      queryClient.invalidateQueries({ queryKey: ["dashboard"] });
      toast.success(t("jobs.created"));
    },
    onError: (error) => toast.error(extractErrorMessage(error)),
  });
}

export function useUpdateJobMutation(companyId: number) {
  const { t } = useTranslation();
  return useMutation({
    mutationFn: (job: JobDTO) => jobsApi.update(job),
    onSuccess: (response) => {
      queryClient.invalidateQueries({ queryKey: jobKeys.company(companyId) });
      queryClient.invalidateQueries({ queryKey: jobKeys.detail(response.data.id) });
      queryClient.invalidateQueries({ queryKey: ["dashboard"] });
      toast.success(t("jobs.updated"));
    },
    onError: (error) => toast.error(extractErrorMessage(error)),
  });
}

export function useDeleteJobMutation(companyId: number) {
  const { t } = useTranslation();
  return useMutation({
    mutationFn: (jobId: number) => jobsApi.delete(jobId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: jobKeys.company(companyId) });
      queryClient.invalidateQueries({ queryKey: ["jobs"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard"] });
      toast.success(t("jobs.deleted"));
    },
    onError: (error) => toast.error(extractErrorMessage(error)),
  });
}

export function useAcceptApplicantMutation(jobId: number) {
  const { t } = useTranslation();
  return useMutation({
    mutationFn: (profileId: number) => jobsApi.accept({ jobId, profileId }),
    onSuccess: (response) => {
      queryClient.invalidateQueries({ queryKey: jobKeys.detail(jobId) });
      queryClient.invalidateQueries({
        queryKey: jobKeys.company(response.data.idCompany),
      });
      queryClient.invalidateQueries({ queryKey: ["notifications"] });
      toast.success(t("jobs.applicantAccepted"));
    },
    onError: (error) => toast.error(extractErrorMessage(error)),
  });
}

export function useRejectApplicantMutation(jobId: number) {
  const { t } = useTranslation();
  return useMutation({
    mutationFn: (profileId: number) => jobsApi.reject({ jobId, profileId }),
    onSuccess: (response) => {
      queryClient.invalidateQueries({ queryKey: jobKeys.detail(jobId) });
      queryClient.invalidateQueries({
        queryKey: jobKeys.company(response.data.idCompany),
      });
      toast.success(t("jobs.applicantRejected"));
    },
    onError: (error) => toast.error(extractErrorMessage(error)),
  });
}
