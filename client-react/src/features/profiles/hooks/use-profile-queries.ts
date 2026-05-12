import axios from "axios";
import { useMutation, useQuery } from "@tanstack/react-query";
import { toast } from "sonner";
import { extractErrorMessage } from "@/lib/api-error";
import { queryClient } from "@/lib/query-client";
import { profilesApi } from "@/features/profiles/api/profiles-api";
import type {
  ProfileDTO,
  ProfileFormValues,
  ProfileSearchParams,
} from "@/types/profile";

export const profileKeys = {
  all: ["profile"] as const,
  me: ["profile", "me"] as const,
  search: (params: ProfileSearchParams) =>
    ["profiles", "search", params] as const,
  detail: (id: number) => ["profiles", "detail", id] as const,
  batch: (ids: number[]) => ["profiles", "batch", ids] as const,
};

export function isProfileMissingError(error: unknown) {
  if (!axios.isAxiosError(error)) return false;
  const message = String(error.response?.data?.message ?? "");
  return (
    error.response?.status === 404 ||
    message.toLowerCase().includes("profile_not_found") ||
    message.toLowerCase().includes("profile not found")
  );
}

export function useMyProfileQuery() {
  const query = useQuery({
    queryKey: profileKeys.me,
    queryFn: async () => (await profilesApi.me()).data,
    retry: (failureCount, error) =>
      !isProfileMissingError(error) && failureCount < 1,
  });

  return {
    ...query,
    profile: query.data ?? null,
    profileMissing: Boolean(query.error && isProfileMissingError(query.error)),
  };
}

export function useProfilesSearchQuery(params: ProfileSearchParams) {
  return useQuery({
    queryKey: profileKeys.search(params),
    queryFn: async () => (await profilesApi.search(params)).data,
  });
}

export function useProfileDetailQuery(id: number | null) {
  return useQuery({
    queryKey: id ? profileKeys.detail(id) : ["profiles", "detail", "invalid"],
    queryFn: async () => {
      if (!id) throw new Error("Invalid profile id");
      return (await profilesApi.findById(id)).data;
    },
    enabled: Boolean(id),
  });
}

export function useApplicantProfilesQuery(ids: number[]) {
  const stableIds = [...new Set(ids)].sort((a, b) => a - b);
  return useQuery({
    queryKey: stableIds.length
      ? profileKeys.batch(stableIds)
      : ["profiles", "batch", "empty"],
    queryFn: async () => {
      if (!stableIds.length) return [];
      return (await profilesApi.batch(stableIds)).data;
    },
    enabled: stableIds.length > 0,
  });
}

function invalidateProfileCaches(profile?: ProfileDTO) {
  queryClient.invalidateQueries({ queryKey: profileKeys.me });
  queryClient.invalidateQueries({ queryKey: ["profiles"] });
  if (profile?.id) {
    queryClient.invalidateQueries({ queryKey: profileKeys.detail(profile.id) });
  }
}

export function useCreateProfileMutation() {
  return useMutation({
    mutationFn: (input: ProfileFormValues) => profilesApi.createMe(input),
    onSuccess: (response) => {
      invalidateProfileCaches(response.data);
      toast.success("Profile created");
    },
    onError: (error) => {
      toast.error(extractErrorMessage(error));
    },
  });
}

export function useUpdateProfileMutation() {
  return useMutation({
    mutationFn: (input: ProfileFormValues) => profilesApi.updateMe(input),
    onSuccess: (response) => {
      invalidateProfileCaches(response.data);
      toast.success("Profile updated");
    },
    onError: (error) => {
      toast.error(extractErrorMessage(error));
    },
  });
}

export function useUpdateAvatarMutation() {
  return useMutation({
    mutationFn: (file: File) => profilesApi.updateAvatar(file),
    onSuccess: (response) => {
      invalidateProfileCaches(response.data);
      toast.success("Avatar updated");
    },
    onError: (error) => {
      toast.error(extractErrorMessage(error));
    },
  });
}

export function useDeleteProfileMutation() {
  return useMutation({
    mutationFn: () => profilesApi.deleteMe(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: profileKeys.me });
      queryClient.invalidateQueries({ queryKey: ["profiles"] });
      queryClient.removeQueries({ queryKey: ["projects", "profile"] });
      toast.success("Profile deleted");
    },
    onError: (error) => {
      toast.error(extractErrorMessage(error));
    },
  });
}
