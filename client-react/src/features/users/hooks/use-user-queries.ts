import { useMutation, useQuery } from "@tanstack/react-query";
import { toast } from "sonner";
import { extractErrorMessage } from "@/lib/api-error";
import { queryClient } from "@/lib/query-client";
import { usersApi } from "@/features/users/api/users-api";
import { useAuthStore } from "@/stores/auth-store";
import type {
  AdminUserDTO,
  ChangeUserRoleRequest,
  ChangeUserStatusRequest,
  CreateManagerUpgradeRequest,
  RejectRoleRequest,
  CreateUserAccountRequest,
  RoleRequestDTO,
  RoleRequestStatus,
  RoleRequestType,
  UpdateUserRequest,
  UserSearchParams,
} from "@/types/user";

export const userKeys = {
  all: ["users"] as const,
  detail: (userId: number) => ["users", "detail", userId] as const,
  search: (params: UserSearchParams) => ["users", "search", params] as const,
  me: ["users", "me"] as const,
  roleRequests: ["users", "role-requests"] as const,
  myRoleRequests: ["users", "role-requests", "me"] as const,
  adminRoleRequests: (params?: {
    status?: RoleRequestStatus | "";
    type?: RoleRequestType | "";
  }) => ["users", "role-requests", "admin", params] as const,
  myHrPromotions: ["users", "hr-promotions", "me"] as const,
};

export function useUsersQuery() {
  return useQuery({
    queryKey: userKeys.all,
    queryFn: async () => (await usersApi.list()).data,
  });
}

export function useCurrentUserQuery() {
  return useQuery({
    queryKey: userKeys.me,
    queryFn: async () => (await usersApi.me()).data,
  });
}

export function useUserSearchQuery(params: UserSearchParams, enabled = true) {
  return useQuery({
    queryKey: userKeys.search(params),
    queryFn: async () => (await usersApi.search(params)).data,
    enabled,
  });
}

export function useCreateUserAccountMutation() {
  return useMutation({
    mutationFn: (input: CreateUserAccountRequest) =>
      usersApi.createAccount(input),
    onSuccess: (response) => {
      queryClient.setQueryData<AdminUserDTO[]>(userKeys.all, (current = []) => {
        const created = response.data;
        return [created, ...current.filter((user) => user.id !== created.id)];
      });
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

function invalidateRoleRequests() {
  queryClient.invalidateQueries({ queryKey: userKeys.roleRequests });
  queryClient.invalidateQueries({ queryKey: ["notifications"] });
}

async function refreshSessionUser() {
  const response = await usersApi.me();
  useAuthStore.getState().updateUser(response.data);
  queryClient.setQueryData(userKeys.me, response.data);
  return response.data;
}

export function useMyRoleRequestsQuery() {
  return useQuery({
    queryKey: userKeys.myRoleRequests,
    queryFn: async () => (await usersApi.myRoleRequests()).data ?? [],
  });
}

export function useAdminRoleRequestsQuery(params?: {
  status?: RoleRequestStatus | "";
  type?: RoleRequestType | "";
}) {
  const cleaned = {
    status: params?.status || undefined,
    type: params?.type || undefined,
  };
  return useQuery({
    queryKey: userKeys.adminRoleRequests(params),
    queryFn: async () =>
      (await usersApi.adminRoleRequests(cleaned)).data ?? [],
  });
}

export function useMyHrPromotionsQuery() {
  return useQuery({
    queryKey: userKeys.myHrPromotions,
    queryFn: async () => (await usersApi.myHrPromotions()).data ?? [],
  });
}

export function useRequestManagerUpgradeMutation() {
  return useMutation({
    mutationFn: (input: CreateManagerUpgradeRequest) =>
      usersApi.requestManagerUpgrade(input),
    onSuccess: () => {
      invalidateRoleRequests();
      toast.success("Manager request submitted");
    },
    onError: (error) => toast.error(extractErrorMessage(error)),
  });
}

export function useApproveRoleRequestMutation() {
  return useMutation({
    mutationFn: (requestId: number) => usersApi.approveRoleRequest(requestId),
    onSuccess: async () => {
      invalidateRoleRequests();
      queryClient.invalidateQueries({ queryKey: userKeys.all });
      toast.success("Role request approved");
    },
    onError: (error) => toast.error(extractErrorMessage(error)),
  });
}

export function useRejectRoleRequestMutation() {
  return useMutation({
    mutationFn: ({
      requestId,
      input,
    }: {
      requestId: number;
      input: RejectRoleRequest;
    }) => usersApi.rejectRoleRequest(requestId, input),
    onSuccess: () => {
      invalidateRoleRequests();
      toast.success("Role request rejected");
    },
    onError: (error) => toast.error(extractErrorMessage(error)),
  });
}

export function useRejectHrPromotionMutation() {
  return useMutation({
    mutationFn: (requestId: number) => usersApi.rejectHrPromotion(requestId),
    onSuccess: () => {
      invalidateRoleRequests();
      toast.success("HR invitation rejected");
    },
    onError: (error) => toast.error(extractErrorMessage(error)),
  });
}

export function useLeaveHrAccountMutation() {
  return useMutation({
    mutationFn: () => usersApi.leaveHr(),
    onSuccess: (response) => {
      useAuthStore.getState().updateUser(response.data);
      queryClient.invalidateQueries({ queryKey: userKeys.all });
      queryClient.invalidateQueries({ queryKey: userKeys.me });
      queryClient.invalidateQueries({ queryKey: ["companies"] });
      toast.success("HR role removed");
    },
    onError: (error) => toast.error(extractErrorMessage(error)),
  });
}

export function useRefreshCurrentUserAfterRoleChange() {
  return useMutation<AdminUserDTO>({
    mutationFn: refreshSessionUser,
    onError: (error) => toast.error(extractErrorMessage(error)),
  });
}

export function getPendingRoleRequests(requests: RoleRequestDTO[]) {
  return requests.filter(
    (request) =>
      request.status === "PENDING_SYSADMIN" ||
      request.status === "PENDING_USER_CONFIRMATION",
  );
}
