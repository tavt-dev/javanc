import { useMutation, useQuery } from "@tanstack/react-query";
import { toast } from "sonner";
import { extractErrorMessage } from "@/lib/api-error";
import { queryClient } from "@/lib/query-client";
import { projectsApi } from "@/features/projects/api/projects-api";
import { profileKeys } from "@/features/profiles/hooks/use-profile-queries";
import { useTranslation } from "react-i18next";
import type { ProjectFormValues } from "@/types/project";

export const projectKeys = {
  me: ["projects", "me"] as const,
  detail: (projectId: number) => ["projects", "detail", projectId] as const,
  profile: (profileId: number) => ["projects", "profile", profileId] as const,
};

export function useMyProjectsQuery(profileId?: number | null) {
  return useQuery({
    queryKey: projectKeys.me,
    queryFn: async () => (await projectsApi.myProjects()).data ?? [],
    enabled: Boolean(profileId),
  });
}

export function useProjectsByProfileQuery(profileId?: number | null) {
  return useQuery({
    queryKey: profileId
      ? projectKeys.profile(profileId)
      : ["projects", "profile", "missing"],
    queryFn: async () => {
      if (!profileId) return [];
      return (await projectsApi.getByProfile(profileId)).data;
    },
    enabled: Boolean(profileId),
  });
}

function invalidateProjectCaches(profileId: number) {
  queryClient.invalidateQueries({ queryKey: projectKeys.profile(profileId) });
  queryClient.invalidateQueries({ queryKey: projectKeys.me });
  queryClient.invalidateQueries({ queryKey: profileKeys.me });
}

export function useSaveProjectMutation(profileId: number) {
  const { t } = useTranslation();
  return useMutation({
    mutationFn: (input: ProjectFormValues) =>
      projectsApi.createMyProject(input),
    onSuccess: () => {
      invalidateProjectCaches(profileId);
      toast.success(t("projects.created"));
    },
    onError: (error) => {
      toast.error(extractErrorMessage(error));
    },
  });
}

export function useUpdateProjectMutation(profileId: number) {
  const { t } = useTranslation();
  return useMutation({
    mutationFn: (input: ProjectFormValues & { id: number }) =>
      projectsApi.updateMyProject(input.id, input),
    onSuccess: () => {
      invalidateProjectCaches(profileId);
      toast.success(t("projects.updated"));
    },
    onError: (error) => {
      toast.error(extractErrorMessage(error));
    },
  });
}

export function useDeleteProjectMutation(profileId: number) {
  const { t } = useTranslation();
  return useMutation({
    mutationFn: (projectId: number) => projectsApi.deleteMyProject(projectId),
    onSuccess: () => {
      invalidateProjectCaches(profileId);
      toast.success(t("projects.deleted"));
    },
    onError: (error) => {
      toast.error(extractErrorMessage(error));
    },
  });
}
