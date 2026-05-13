import { useMutation, useQuery } from "@tanstack/react-query";
import { toast } from "sonner";
import { extractErrorMessage } from "@/lib/api-error";
import { queryClient } from "@/lib/query-client";
import { jobsApi } from "@/features/jobs/api/jobs-api";
import type { JobDTO } from "@/types/job";

export const jobKeys = {
  all: ["jobs", "all"] as const,
  newest: (profileId: number) => ["jobs", "new", profileId] as const,
  detail: (jobId: number) => ["jobs", "detail", jobId] as const,
  company: (companyId: number) => ["jobs", "company", companyId] as const,
  pending: (profileId: number) => ["jobs", "pending", profileId] as const,
  accepted: (profileId: number) => ["jobs", "accepted", profileId] as const,
  applicationStatus: (jobId: number) => ["jobs", "application-status", jobId] as const,
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

export function useApplyCurrentUserJobMutation() {
  return useMutation({
    mutationFn: (jobId: number) => jobsApi.applyCurrentUser(jobId),
    onSuccess: (response) => {
      queryClient.invalidateQueries({ queryKey: ["jobs"] });
      queryClient.invalidateQueries({ queryKey: ["notifications"] });
      queryClient.invalidateQueries({ queryKey: jobKeys.detail(response.data.id) });
      queryClient.invalidateQueries({
        queryKey: jobKeys.applicationStatus(response.data.id),
      });
      toast.success("Application submitted");
    },
    onError: (error) => {
      toast.error(extractErrorMessage(error));
    },
  });
}

export function useLeaveCurrentUserJobMutation() {
  return useMutation({
    mutationFn: (jobId: number) => jobsApi.leaveCurrentUser(jobId),
    onSuccess: (response) => {
      queryClient.invalidateQueries({ queryKey: ["jobs"] });
      queryClient.invalidateQueries({ queryKey: ["notifications"] });
      queryClient.invalidateQueries({ queryKey: jobKeys.detail(response.data.id) });
      queryClient.invalidateQueries({
        queryKey: jobKeys.applicationStatus(response.data.id),
      });
      toast.success("Application withdrawn");
    },
    onError: (error) => {
      toast.error(extractErrorMessage(error));
    },
  });
}

export function useCreateJobMutation(companyId: number) {
  return useMutation({
    mutationFn: (job: JobDTO) => jobsApi.create(job),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: jobKeys.company(companyId) });
      queryClient.invalidateQueries({ queryKey: ["dashboard"] });
      toast.success("Job created");
    },
    onError: (error) => toast.error(extractErrorMessage(error)),
  });
}

export function useUpdateJobMutation(companyId: number) {
  return useMutation({
    mutationFn: (job: JobDTO) => jobsApi.update(job),
    onSuccess: (response) => {
      queryClient.invalidateQueries({ queryKey: jobKeys.company(companyId) });
      queryClient.invalidateQueries({ queryKey: jobKeys.detail(response.data.id) });
      queryClient.invalidateQueries({ queryKey: ["dashboard"] });
      toast.success("Job updated");
    },
    onError: (error) => toast.error(extractErrorMessage(error)),
  });
}

export function useDeleteJobMutation(companyId: number) {
  return useMutation({
    mutationFn: (jobId: number) => jobsApi.delete(jobId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: jobKeys.company(companyId) });
      queryClient.invalidateQueries({ queryKey: ["jobs"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard"] });
      toast.success("Job deleted");
    },
    onError: (error) => toast.error(extractErrorMessage(error)),
  });
}

export function useAcceptApplicantMutation(jobId: number) {
  return useMutation({
    mutationFn: (profileId: number) => jobsApi.accept({ jobId, profileId }),
    onSuccess: (response) => {
      queryClient.invalidateQueries({ queryKey: jobKeys.detail(jobId) });
      queryClient.invalidateQueries({
        queryKey: jobKeys.company(response.data.idCompany),
      });
      queryClient.invalidateQueries({ queryKey: ["notifications"] });
      toast.success("Applicant accepted");
    },
    onError: (error) => toast.error(extractErrorMessage(error)),
  });
}

export function useRejectApplicantMutation(jobId: number) {
  return useMutation({
    mutationFn: (profileId: number) => jobsApi.reject({ jobId, profileId }),
    onSuccess: (response) => {
      queryClient.invalidateQueries({ queryKey: jobKeys.detail(jobId) });
      queryClient.invalidateQueries({
        queryKey: jobKeys.company(response.data.idCompany),
      });
      toast.success("Applicant rejected");
    },
    onError: (error) => toast.error(extractErrorMessage(error)),
  });
}
