import { useMutation, useQuery } from "@tanstack/react-query";
import { toast } from "sonner";
import { extractErrorMessage } from "@/lib/api-error";
import { queryClient } from "@/lib/query-client";
import { jobsApi } from "@/features/jobs/api/jobs-api";

export const jobKeys = {
  all: ["jobs", "all"] as const,
  newest: (profileId: number) => ["jobs", "new", profileId] as const,
  detail: (jobId: number) => ["jobs", "detail", jobId] as const,
  company: (companyId: number) => ["jobs", "company", companyId] as const,
  pending: (profileId: number) => ["jobs", "pending", profileId] as const,
  accepted: (profileId: number) => ["jobs", "accepted", profileId] as const,
};

export function useJobBoardQuery(profileId?: number | null) {
  return useQuery({
    queryKey: profileId ? jobKeys.newest(profileId) : jobKeys.all,
    queryFn: async () => {
      const response = profileId
        ? await jobsApi.getNewForProfile(profileId)
        : await jobsApi.getAll();
      return response.data;
    },
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

export function useJobsByCompanyQuery(companyId?: number | null) {
  return useQuery({
    queryKey: companyId ? jobKeys.company(companyId) : ["jobs", "company", "missing"],
    queryFn: async () => {
      if (!companyId) return [];
      return (await jobsApi.getByCompany(companyId)).data;
    },
    enabled: Boolean(companyId),
  });
}

export function usePendingJobsQuery(profileId?: number | null) {
  return useQuery({
    queryKey: profileId ? jobKeys.pending(profileId) : ["jobs", "pending", "missing"],
    queryFn: async () => {
      if (!profileId) return [];
      return (await jobsApi.getPendingByProfile(profileId)).data;
    },
    enabled: Boolean(profileId),
  });
}

export function useAcceptedJobsQuery(profileId?: number | null) {
  return useQuery({
    queryKey: profileId
      ? jobKeys.accepted(profileId)
      : ["jobs", "accepted", "missing"],
    queryFn: async () => {
      if (!profileId) return [];
      return (await jobsApi.getAcceptedByProfile(profileId)).data;
    },
    enabled: Boolean(profileId),
  });
}

export function useApplyJobMutation(profileId: number) {
  return useMutation({
    mutationFn: (jobId: number) => jobsApi.apply({ jobId, profileId }),
    onSuccess: (response) => {
      queryClient.invalidateQueries({ queryKey: ["jobs"] });
      queryClient.invalidateQueries({ queryKey: ["notifications"] });
      queryClient.invalidateQueries({ queryKey: jobKeys.detail(response.data.id) });
      toast.success("Application submitted");
    },
    onError: (error) => {
      toast.error(extractErrorMessage(error));
    },
  });
}
