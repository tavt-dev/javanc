import { useMutation, useQuery } from "@tanstack/react-query";
import { toast } from "sonner";
import { extractErrorMessage } from "@/lib/api-error";
import { queryClient } from "@/lib/query-client";
import { usersApi } from "@/features/users/api/users-api";
import { useAuthStore } from "@/stores/auth-store";
import { useTranslation } from "react-i18next";
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
    page?: number;
    size?: number;
    sort?: string;
  }) => ["users", "role-requests", "admin", params] as const,
  myHrPromotions: ["users", "hr-promotions", "me"] as const,
};

export function useUsersQuery(params: UserSearchParams = {}) {
  return useQuery({
    queryKey: ["users", "list", params],
    queryFn: async () => (await usersApi.list(params)).data,
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
  const { t } = useTranslation();
  return useMutation({
    mutationFn: (input: CreateUserAccountRequest) =>
      usersApi.createAccount(input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["users"] });
      toast.success(t("users.accountCreated"));
    },
    onError: (error) => toast.error(extractErrorMessage(error)),
  });
}

export function useUpdateUserMutation(userId: number) {
  const { t } = useTranslation();
  return useMutation({
    mutationFn: (input: UpdateUserRequest) => usersApi.update(userId, input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: userKeys.all });
      queryClient.invalidateQueries({ queryKey: userKeys.detail(userId) });
      toast.success(t("users.userUpdated"));
    },
    onError: (error) => toast.error(extractErrorMessage(error)),
  });
}

export function useChangeUserRoleMutation(userId: number) {
  const { t } = useTranslation();
  return useMutation({
    mutationFn: (input: ChangeUserRoleRequest) =>
      usersApi.changeRole(userId, input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: userKeys.all });
      queryClient.invalidateQueries({ queryKey: userKeys.detail(userId) });
      toast.success(t("users.roleUpdated"));
    },
    onError: (error) => toast.error(extractErrorMessage(error)),
  });
}

export function useChangeUserStatusMutation(userId: number) {
  const { t } = useTranslation();
  return useMutation({
    mutationFn: (input: ChangeUserStatusRequest) =>
      usersApi.changeStatus(userId, input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: userKeys.all });
      queryClient.invalidateQueries({ queryKey: userKeys.detail(userId) });
      toast.success(t("users.statusUpdated"));
    },
    onError: (error) => toast.error(extractErrorMessage(error)),
  });
}

export function useDeleteUserMutation(userId: number) {
  const { t } = useTranslation();
  return useMutation({
    mutationFn: () => usersApi.delete(userId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: userKeys.all });
      toast.success(t("users.userDeleted"));
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
    queryFn: async () => (await usersApi.myRoleRequests()).data,
  });
}

export function useAdminRoleRequestsQuery(params?: {
  status?: RoleRequestStatus | "";
  type?: RoleRequestType | "";
  page?: number;
  size?: number;
  sort?: string;
}) {
  const cleaned = {
    status: params?.status || undefined,
    type: params?.type || undefined,
  };
  return useQuery({
    queryKey: userKeys.adminRoleRequests(params),
    queryFn: async () =>
      (await usersApi.adminRoleRequests({
        ...cleaned,
        page: params?.page,
        size: params?.size,
        sort: params?.sort,
      })).data,
  });
}

export function useMyHrPromotionsQuery() {
  return useQuery({
    queryKey: userKeys.myHrPromotions,
    queryFn: async () => (await usersApi.myHrPromotions()).data,
  });
}

export function useRequestManagerUpgradeMutation() {
  const { t } = useTranslation();
  return useMutation({
    mutationFn: (input: CreateManagerUpgradeRequest) =>
      usersApi.requestManagerUpgrade(input),
    onSuccess: () => {
      invalidateRoleRequests();
      toast.success(t("users.managerRequestSent"));
    },
    onError: (error) => toast.error(extractErrorMessage(error)),
  });
}

export function useApproveRoleRequestMutation() {
  const { t } = useTranslation();
  return useMutation({
    mutationFn: (requestId: number) => usersApi.approveRoleRequest(requestId),
    onSuccess: async () => {
      invalidateRoleRequests();
      queryClient.invalidateQueries({ queryKey: userKeys.all });
      toast.success(t("users.roleRequestApproved"));
    },
    onError: (error) => toast.error(extractErrorMessage(error)),
  });
}

export function useRejectRoleRequestMutation() {
  const { t } = useTranslation();
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
      toast.success(t("users.roleRequestRejected"));
    },
    onError: (error) => toast.error(extractErrorMessage(error)),
  });
}

export function useRejectHrPromotionMutation() {
  const { t } = useTranslation();
  return useMutation({
    mutationFn: (requestId: number) => usersApi.rejectHrPromotion(requestId),
    onSuccess: () => {
      invalidateRoleRequests();
      toast.success(t("users.hrInvitationRejected"));
    },
    onError: (error) => toast.error(extractErrorMessage(error)),
  });
}

export function useLeaveHrAccountMutation() {
  const { t } = useTranslation();
  return useMutation({
    mutationFn: () => usersApi.leaveHr(),
    onSuccess: (response) => {
      useAuthStore.getState().updateUser(response.data);
      queryClient.invalidateQueries({ queryKey: userKeys.all });
      queryClient.invalidateQueries({ queryKey: userKeys.me });
      queryClient.invalidateQueries({ queryKey: ["companies"] });
      toast.success(t("users.leftHrRole"));
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
