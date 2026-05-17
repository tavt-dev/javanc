import { createColumnHelper } from "@tanstack/react-table";
import { Check, ClipboardList, Edit, Plus, Trash2, X } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { PageTransition } from "@/components/motion/PageTransition";
import { ConfirmDialog } from "@/components/shared/ConfirmDialog";
import { DataTable } from "@/components/shared/DataTable";
import { DataToolbar } from "@/components/shared/DataToolbar";
import { LoadingSkeleton } from "@/components/shared/LoadingSkeleton";
import { ManagementDialog } from "@/components/shared/ManagementDialog";
import { PageHeader } from "@/components/shared/PageHeader";
import { PaginationControls } from "@/components/shared/PaginationControls";
import { RetryState } from "@/components/shared/RetryState";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { InternalAccountForm } from "@/features/users/components/InternalAccountForm";
import { UserEditForm } from "@/features/users/components/UserEditForm";
import {
  useAdminRoleRequestsQuery,
  useApproveRoleRequestMutation,
  useChangeUserStatusMutation,
  useCreateUserAccountMutation,
  useDeleteUserMutation,
  useRejectRoleRequestMutation,
  useUpdateUserMutation,
  useUsersQuery,
} from "@/features/users/hooks/use-user-queries";
import { canDeactivateUser } from "@/features/users/utils/user-utils";
import { useAuthStore } from "@/stores/auth-store";
import type { Role } from "@/types/auth";
import type {
  AdminUserDTO,
  InternalAccountFormValues,
  RoleRequestDTO,
  RoleRequestStatus,
  RoleRequestType,
  UpdateUserRequest,
} from "@/types/user";

const columnHelper = createColumnHelper<AdminUserDTO>();

export function UserManagementPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const currentUser = useAuthStore((s) => s.user);
  const [search, setSearch] = useState(() => searchParams.get("query") ?? "");
  const [debouncedSearch, setDebouncedSearch] = useState(
    () => searchParams.get("query") ?? "",
  );
  const role = (searchParams.get("role") as "all" | Role | null) ?? "all";
  const active =
    (searchParams.get("active") as "all" | "active" | "inactive" | null) ??
    "all";
  const page = Number(searchParams.get("page") ?? 0);
  const size = Number(searchParams.get("size") ?? 20);
  const sort = searchParams.get("sort") ?? "createdAt,desc";
  const [tab, setTab] = useState<"users" | "roleRequests">("users");
  const [requestStatus, setRequestStatus] = useState<RoleRequestStatus | "">("PENDING_SYSADMIN");
  const [requestType, setRequestType] = useState<RoleRequestType | "">("");
  const [createOpen, setCreateOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<AdminUserDTO | null>(null);
  const [deleteUser, setDeleteUser] = useState<AdminUserDTO | null>(null);
  const [rejectingRequest, setRejectingRequest] =
    useState<RoleRequestDTO | null>(null);
  const [adminNote, setAdminNote] = useState("");

  const usersQuery = useUsersQuery({
    query: debouncedSearch || undefined,
    role: role === "all" ? undefined : role,
    active: active === "all" ? undefined : active === "active",
    page,
    size,
    sort,
  });
  const roleRequestsQuery = useAdminRoleRequestsQuery({
    status: requestStatus,
    type: requestType,
  });
  const users = usersQuery.data?.items ?? [];
  const createMutation = useCreateUserAccountMutation();
  const updateMutation = useUpdateUserMutation(editingUser?.id ?? 0);
  const statusMutation = useChangeUserStatusMutation(deleteUser?.id ?? 0);
  const deleteMutation = useDeleteUserMutation(deleteUser?.id ?? 0);
  const approveMutation = useApproveRoleRequestMutation();
  const rejectMutation = useRejectRoleRequestMutation();

  const updateListParams = (next: Record<string, string | undefined>) => {
    const updated = new URLSearchParams(searchParams);
    Object.entries(next).forEach(([key, value]) => {
      if (!value) updated.delete(key);
      else updated.set(key, value);
    });
    setSearchParams(updated, { replace: true });
  };

  useEffect(() => {
    const timeout = window.setTimeout(() => {
      const trimmedSearch = search.trim();
      setDebouncedSearch(trimmedSearch);
      updateListParams({ query: trimmedSearch || undefined, page: "0" });
    }, 300);
    return () => window.clearTimeout(timeout);
    // updateListParams depends on the current URL and should not restart the debounce after each URL write.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search]);

  const columns = useMemo(
    () => [
      columnHelper.accessor("name", {
        header: "User",
        cell: ({ row }) => (
          <div className="min-w-44">
            <p className="font-medium">{row.original.name}</p>
            <p className="text-xs text-muted-foreground">{row.original.email}</p>
          </div>
        ),
      }),
      columnHelper.accessor("idEmployee", {
        header: "Employee ID",
        cell: ({ getValue }) => getValue() || "-",
      }),
      columnHelper.accessor("role", {
        header: "Role",
        cell: ({ getValue }) => <StatusBadge tone="primary">{getValue()}</StatusBadge>,
      }),
      columnHelper.accessor("active", {
        header: "Status",
        cell: ({ row }) => (
          <StatusBadge tone={row.original.active ? "success" : "warning"}>
            {row.original.status || (row.original.active ? "ACTIVE" : "DISABLED")}
          </StatusBadge>
        ),
      }),
      columnHelper.display({
        id: "actions",
        header: "Actions",
        cell: ({ row }) => {
          const selfProtected = !canDeactivateUser(row.original, currentUser?.id);
          return (
            <div className="flex flex-wrap gap-2">
              <button type="button" onClick={() => setEditingUser(row.original)} className="inline-flex items-center gap-1 rounded-md border border-border px-2 py-1 text-xs font-medium hover:bg-accent">
                <Edit size={13} />
                Edit
              </button>
              <button
                type="button"
                disabled={selfProtected}
                onClick={() => setDeleteUser(row.original)}
                className="inline-flex items-center gap-1 rounded-md border border-destructive/30 px-2 py-1 text-xs font-medium text-destructive hover:bg-destructive/10 disabled:cursor-not-allowed disabled:opacity-50"
              >
                <Trash2 size={13} />
                Deactivate
              </button>
            </div>
          );
        },
      }),
    ],
    [currentUser?.id],
  );

  const createAccount = (values: InternalAccountFormValues) => {
    createMutation.mutate(
      {
        name: values.name,
        email: values.email,
        password: values.password,
        employeeId: values.employeeId || undefined,
        role: values.role ?? "user",
      },
      { onSuccess: () => setCreateOpen(false) },
    );
  };

  const updateUser = (values: UpdateUserRequest) => {
    updateMutation.mutate(
      { ...values, password: values.password || undefined },
      { onSuccess: () => setEditingUser(null) },
    );
  };

  return (
    <PageTransition>
      <PageHeader
        variant="console"
        eyebrow="Admin console"
        title="User Management"
        description="Manage internal accounts, account status, and role request approvals."
        actions={
          <button type="button" onClick={() => setCreateOpen(true)} className="btn-primary focus-ring bg-white text-emerald-800 hover:bg-emerald-50">
            <Plus size={16} />
            Create account
          </button>
        }
      />

      <div className="inline-flex rounded-lg border border-border bg-card p-1">
        <button
          type="button"
          onClick={() => setTab("users")}
          className={`rounded-md px-3 py-2 text-sm font-medium ${
            tab === "users" ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-accent"
          }`}
        >
          Users
        </button>
        <button
          type="button"
          onClick={() => setTab("roleRequests")}
          className={`inline-flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium ${
            tab === "roleRequests" ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-accent"
          }`}
        >
          <ClipboardList size={15} />
          Role requests
        </button>
      </div>

      {tab === "users" ? (
        <>
          <DataToolbar
            search={search}
            searchPlaceholder="Search users"
            onSearchChange={setSearch}
            onClear={() => {
              setSearch("");
              setDebouncedSearch("");
              updateListParams({ query: undefined, role: undefined, active: undefined, page: "0" });
            }}
            variant="job-search"
            filters={
              <>
                <select className="form-input sm:w-36" value={role} onChange={(event) => updateListParams({ role: event.target.value === "all" ? undefined : event.target.value, page: "0" })}>
                  <option value="all">All roles</option>
                  <option value="user">User</option>
                  <option value="hr">HR</option>
                  <option value="manager">Manager</option>
                  <option value="admin">Admin</option>
                </select>
                <select className="form-input sm:w-36" value={active} onChange={(event) => updateListParams({ active: event.target.value === "all" ? undefined : event.target.value, page: "0" })}>
                  <option value="all">All status</option>
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                </select>
              </>
            }
          />

          {usersQuery.isLoading ? (
            <LoadingSkeleton variant="detail" />
          ) : usersQuery.error ? (
            <RetryState error={usersQuery.error} onRetry={usersQuery.refetch} />
          ) : (
            <div className="space-y-4">
              <DataTable data={users} columns={columns} empty="No users found." />
              {usersQuery.data && (
                <PaginationControls
                  page={usersQuery.data}
                  onPageChange={(nextPage) => updateListParams({ page: String(nextPage) })}
                  onSizeChange={(nextSize) => updateListParams({ size: String(nextSize), page: "0" })}
                />
              )}
            </div>
          )}
        </>
      ) : (
        <section className="surface p-5">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="text-lg font-semibold">Role requests</h2>
              <p className="mt-1 text-sm text-muted-foreground">
                Direct role changes are disabled by the backend. Approve or reject requests here.
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              <select
                className="form-input sm:w-56"
                value={requestStatus}
                onChange={(event) =>
                  setRequestStatus(event.target.value as RoleRequestStatus | "")
                }
              >
                <option value="">All status</option>
                <option value="PENDING_SYSADMIN">Pending admin</option>
                <option value="PENDING_USER_CONFIRMATION">Pending user</option>
                <option value="APPROVED">Approved</option>
                <option value="REJECTED">Rejected</option>
                <option value="CANCELLED">Cancelled</option>
              </select>
              <select
                className="form-input sm:w-48"
                value={requestType}
                onChange={(event) =>
                  setRequestType(event.target.value as RoleRequestType | "")
                }
              >
                <option value="">All types</option>
                <option value="MANAGER_UPGRADE">Manager upgrade</option>
                <option value="HR_PROMOTION">HR promotion</option>
              </select>
            </div>
          </div>

          {roleRequestsQuery.isLoading ? (
            <div className="mt-4">
              <LoadingSkeleton variant="detail" />
            </div>
          ) : roleRequestsQuery.error ? (
            <div className="mt-4">
              <RetryState
                error={roleRequestsQuery.error}
                onRetry={roleRequestsQuery.refetch}
              />
            </div>
          ) : (
            <div className="mt-4 grid gap-3">
              {(roleRequestsQuery.data?.items ?? []).length ? (
                (roleRequestsQuery.data?.items ?? []).map((request) => (
                  <RoleRequestRow
                    key={request.id}
                    request={request}
                    approving={approveMutation.isPending}
                    rejecting={rejectMutation.isPending}
                    onApprove={() => approveMutation.mutate(request.id)}
                    onReject={() => {
                      setAdminNote("");
                      setRejectingRequest(request);
                    }}
                  />
                ))
              ) : (
                <p className="text-sm text-muted-foreground">
                  No role requests found.
                </p>
              )}
            </div>
          )}
        </section>
      )}

      <ManagementDialog open={createOpen} title="Create account" description="For assigned HR/manager accounts, prefer company assignment workflows." onClose={() => setCreateOpen(false)}>
        <InternalAccountForm loading={createMutation.isPending} onSubmit={createAccount} onCancel={() => setCreateOpen(false)} />
      </ManagementDialog>

      {editingUser && (
        <ManagementDialog open title="Edit user" description="Update profile fields without changing role/status." onClose={() => setEditingUser(null)}>
          <UserEditForm user={editingUser} loading={updateMutation.isPending} onSubmit={updateUser} onCancel={() => setEditingUser(null)} />
        </ManagementDialog>
      )}

      {rejectingRequest && (
        <ManagementDialog
          open
          title="Reject role request"
          description={`Reject request #${rejectingRequest.id}.`}
          onClose={() => setRejectingRequest(null)}
        >
          <div className="space-y-4">
            <label className="block space-y-1.5 text-sm">
              <span className="font-medium text-foreground">Admin note</span>
              <textarea
                className="form-input min-h-24 resize-y"
                value={adminNote}
                onChange={(event) => setAdminNote(event.target.value)}
                placeholder="Optional rejection reason"
              />
            </label>
            <div className="flex justify-end gap-2">
              <button
                type="button"
                className="rounded-md border border-border px-4 py-2 text-sm font-medium hover:bg-accent"
                onClick={() => setRejectingRequest(null)}
              >
                Cancel
              </button>
              <button
                type="button"
                className="inline-flex items-center gap-2 rounded-md bg-destructive px-4 py-2 text-sm font-medium text-destructive-foreground hover:bg-destructive/90"
                disabled={rejectMutation.isPending}
                onClick={() =>
                  rejectMutation.mutate(
                    {
                      requestId: rejectingRequest.id,
                      input: { adminNote: adminNote || undefined },
                    },
                    { onSuccess: () => setRejectingRequest(null) },
                  )
                }
              >
                <X size={16} />
                Reject
              </button>
            </div>
          </div>
        </ManagementDialog>
      )}

      <ConfirmDialog
        open={Boolean(deleteUser)}
        title="Deactivate user"
        description={`Deactivate ${deleteUser?.name ?? "this user"}?`}
        confirmLabel="Deactivate"
        destructive
        loading={statusMutation.isPending || deleteMutation.isPending}
        onCancel={() => setDeleteUser(null)}
        onConfirm={() => {
          if (!deleteUser) return;
          statusMutation.mutate(
            { active: false, status: "DISABLED" },
            { onSuccess: () => setDeleteUser(null) },
          );
        }}
      />
    </PageTransition>
  );
}

function RoleRequestRow({
  request,
  approving,
  rejecting,
  onApprove,
  onReject,
}: {
  request: RoleRequestDTO;
  approving: boolean;
  rejecting: boolean;
  onApprove: () => void;
  onReject: () => void;
}) {
  const canAdminDecide =
    request.type === "MANAGER_UPGRADE" &&
    request.status === "PENDING_SYSADMIN";

  return (
    <div className="rounded-lg border border-border bg-background/40 p-4">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
        <div className="min-w-0">
          <div className="flex flex-wrap gap-2">
            <StatusBadge tone="primary">{request.type}</StatusBadge>
            <StatusBadge tone={roleRequestTone(request.status)}>
              {request.status}
            </StatusBadge>
            <StatusBadge tone="neutral">{request.requestedRole}</StatusBadge>
          </div>
          <h3 className="mt-3 font-semibold">
            {request.targetName || `User #${request.targetUserId}`}
          </h3>
          <p className="mt-1 text-sm text-muted-foreground">
            Requested by {request.requesterName || `user #${request.requesterUserId}`}
            {request.companyName ? ` for ${request.companyName}` : ""}
          </p>
          {request.reason && (
            <p className="mt-2 text-sm text-muted-foreground">
              {request.reason}
            </p>
          )}
          {request.adminNote && (
            <p className="mt-2 text-sm text-destructive">
              {request.adminNote}
            </p>
          )}
        </div>
        {canAdminDecide && (
          <div className="flex shrink-0 gap-2">
            <button
              type="button"
              disabled={approving}
              onClick={onApprove}
              className="inline-flex items-center gap-2 rounded-md bg-primary px-3 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-70"
            >
              <Check size={15} />
              Approve
            </button>
            <button
              type="button"
              disabled={rejecting}
              onClick={onReject}
              className="inline-flex items-center gap-2 rounded-md border border-destructive/30 px-3 py-2 text-sm font-medium text-destructive hover:bg-destructive/10 disabled:opacity-70"
            >
              <X size={15} />
              Reject
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

function roleRequestTone(status: RoleRequestStatus) {
  if (status === "APPROVED") return "success";
  if (status === "REJECTED" || status === "CANCELLED") return "danger";
  return "warning";
}
