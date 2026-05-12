import { useMutation, useQuery } from "@tanstack/react-query";
import { toast } from "sonner";
import { extractErrorMessage } from "@/lib/api-error";
import { queryClient } from "@/lib/query-client";
import { usersApi } from "@/features/users/api/users-api";
import type {
  ChangeUserRoleRequest,
  ChangeUserStatusRequest,
  CreateUserAccountRequest,
  UpdateUserRequest,
} from "@/types/user";

export const userKeys = {
  all: ["users"] as const,
  detail: (userId: number) => ["users", "detail", userId] as const,
};

export function useUsersQuery() {
  return useQuery({
    queryKey: userKeys.all,
    queryFn: async () => (await usersApi.list()).data,
  });
}

export function useCreateUserAccountMutation() {
  return useMutation({
    mutationFn: (input: CreateUserAccountRequest) =>
      usersApi.createAccount(input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: userKeys.all });
      toast.success("Account created");
    },
    onError: (error) => toast.error(extractErrorMessage(error)),
  });
}

export function useUpdateUserMutation(userId: number) {
  return useMutation({
    mutationFn: (input: UpdateUserRequest) => usersApi.update(userId, input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: userKeys.all });
      queryClient.invalidateQueries({ queryKey: userKeys.detail(userId) });
      toast.success("User updated");
    },
    onError: (error) => toast.error(extractErrorMessage(error)),
  });
}

export function useChangeUserRoleMutation(userId: number) {
  return useMutation({
    mutationFn: (input: ChangeUserRoleRequest) =>
      usersApi.changeRole(userId, input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: userKeys.all });
      queryClient.invalidateQueries({ queryKey: userKeys.detail(userId) });
      toast.success("Role updated");
    },
    onError: (error) => toast.error(extractErrorMessage(error)),
  });
}

export function useChangeUserStatusMutation(userId: number) {
  return useMutation({
    mutationFn: (input: ChangeUserStatusRequest) =>
      usersApi.changeStatus(userId, input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: userKeys.all });
      queryClient.invalidateQueries({ queryKey: userKeys.detail(userId) });
      toast.success("Status updated");
    },
    onError: (error) => toast.error(extractErrorMessage(error)),
  });
}

export function useDeleteUserMutation(userId: number) {
  return useMutation({
    mutationFn: () => usersApi.delete(userId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: userKeys.all });
      toast.success("User deactivated");
    },
    onError: (error) => toast.error(extractErrorMessage(error)),
  });
}
