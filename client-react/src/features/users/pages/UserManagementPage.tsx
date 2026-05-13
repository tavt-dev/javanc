import { createColumnHelper } from "@tanstack/react-table";
import { Edit, Plus, Shield, Trash2 } from "lucide-react";
import { useMemo, useState } from "react";
import { PageTransition } from "@/components/motion/PageTransition";
import { ConfirmDialog } from "@/components/shared/ConfirmDialog";
import { DataTable } from "@/components/shared/DataTable";
import { DataToolbar } from "@/components/shared/DataToolbar";
import { LoadingSkeleton } from "@/components/shared/LoadingSkeleton";
import { ManagementDialog } from "@/components/shared/ManagementDialog";
import { PageHeader } from "@/components/shared/PageHeader";
import { RetryState } from "@/components/shared/RetryState";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { InternalAccountForm } from "@/features/users/components/InternalAccountForm";
import { UserEditForm } from "@/features/users/components/UserEditForm";
import {
  useChangeUserRoleMutation,
  useChangeUserStatusMutation,
  useCreateUserAccountMutation,
  useDeleteUserMutation,
  useUpdateUserMutation,
  useUsersQuery,
} from "@/features/users/hooks/use-user-queries";
import { canDeactivateUser, filterUsers } from "@/features/users/utils/user-utils";
import { useAuthStore } from "@/stores/auth-store";
import type { Role } from "@/types/auth";
import type { AdminUserDTO, InternalAccountFormValues, UpdateUserRequest } from "@/types/user";

const columnHelper = createColumnHelper<AdminUserDTO>();

export function UserManagementPage() {
  const currentUser = useAuthStore((s) => s.user);
  const [search, setSearch] = useState("");
  const [role, setRole] = useState<"all" | Role>("all");
  const [active, setActive] = useState<"all" | "active" | "inactive">("all");
  const [createOpen, setCreateOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<AdminUserDTO | null>(null);
  const [roleUser, setRoleUser] = useState<AdminUserDTO | null>(null);
  const [deleteUser, setDeleteUser] = useState<AdminUserDTO | null>(null);

  const usersQuery = useUsersQuery();
  const users = useMemo(() => usersQuery.data ?? [], [usersQuery.data]);
  const createMutation = useCreateUserAccountMutation();
  const updateMutation = useUpdateUserMutation(editingUser?.id ?? 0);
  const roleMutation = useChangeUserRoleMutation(roleUser?.id ?? 0);
  const statusMutation = useChangeUserStatusMutation(deleteUser?.id ?? 0);
  const deleteMutation = useDeleteUserMutation(deleteUser?.id ?? 0);

  const filteredUsers = useMemo(
    () => filterUsers(users, { search, role, active }),
    [active, role, search, users],
  );

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
              <button type="button" onClick={() => setRoleUser(row.original)} className="inline-flex items-center gap-1 rounded-md border border-border px-2 py-1 text-xs font-medium hover:bg-accent">
                <Shield size={13} />
                Role
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
        description="Manage internal accounts, roles, and active status."
        actions={
          <button type="button" onClick={() => setCreateOpen(true)} className="btn-primary focus-ring bg-white text-emerald-800 hover:bg-emerald-50">
            <Plus size={16} />
            Create account
          </button>
        }
      />

      <DataToolbar
        search={search}
        searchPlaceholder="Search users"
        onSearchChange={setSearch}
        onClear={() => {
          setSearch("");
          setRole("all");
          setActive("all");
        }}
        variant="job-search"
        filters={
          <>
            <select className="form-input sm:w-36" value={role} onChange={(event) => setRole(event.target.value as "all" | Role)}>
              <option value="all">All roles</option>
              <option value="user">User</option>
              <option value="hr">HR</option>
              <option value="manager">Manager</option>
              <option value="admin">Admin</option>
            </select>
            <select className="form-input sm:w-36" value={active} onChange={(event) => setActive(event.target.value as "all" | "active" | "inactive")}>
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
        <DataTable data={filteredUsers} columns={columns} empty="No users found." />
      )}

      <ManagementDialog open={createOpen} title="Create account" description="For assigned HR/manager accounts, prefer company assignment workflows." onClose={() => setCreateOpen(false)}>
        <InternalAccountForm loading={createMutation.isPending} onSubmit={createAccount} onCancel={() => setCreateOpen(false)} />
      </ManagementDialog>

      {editingUser && (
        <ManagementDialog open title="Edit user" description="Update profile fields without changing role/status." onClose={() => setEditingUser(null)}>
          <UserEditForm user={editingUser} loading={updateMutation.isPending} onSubmit={updateUser} onCancel={() => setEditingUser(null)} />
        </ManagementDialog>
      )}

      {roleUser && (
        <ManagementDialog open title="Change role" description="Role changes affect access immediately after the next session refresh." onClose={() => setRoleUser(null)}>
          <div className="space-y-4">
            <select className="form-input" defaultValue={roleUser.role} onChange={(event) => {
              roleMutation.mutate({ role: event.target.value as Role }, { onSuccess: () => setRoleUser(null) });
            }}>
              <option value="user">User</option>
              <option value="hr">HR</option>
              <option value="manager">Manager</option>
              <option value="admin">Admin</option>
            </select>
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
