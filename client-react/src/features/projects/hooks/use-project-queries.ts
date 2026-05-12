import { useMutation, useQuery } from "@tanstack/react-query";
import { toast } from "sonner";
import { extractErrorMessage } from "@/lib/api-error";
import { queryClient } from "@/lib/query-client";
import { projectsApi } from "@/features/projects/api/projects-api";
import { profileKeys } from "@/features/profiles/hooks/use-profile-queries";
import type { ProjectFormValues } from "@/types/project";

export const projectKeys = {
  profile: (profileId: number) => ["projects", "profile", profileId] as const,
};

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
  queryClient.invalidateQueries({ queryKey: profileKeys.me });
}

export function useSaveProjectMutation(profileId: number) {
  return useMutation({
    mutationFn: (input: ProjectFormValues) =>
      projectsApi.save({ ...input, idProfile: profileId }),
    onSuccess: () => {
      invalidateProjectCaches(profileId);
      toast.success("Project created");
    },
    onError: (error) => {
      toast.error(extractErrorMessage(error));
    },
  });
}

export function useUpdateProjectMutation(profileId: number) {
  return useMutation({
    mutationFn: (input: ProjectFormValues & { id: number }) =>
      projectsApi.update({ ...input, idProfile: profileId }),
    onSuccess: () => {
      invalidateProjectCaches(profileId);
      toast.success("Project updated");
    },
    onError: (error) => {
      toast.error(extractErrorMessage(error));
    },
  });
}
