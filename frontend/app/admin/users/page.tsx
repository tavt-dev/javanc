"use client";

import { useState } from "react";
import { CheckCircle2, Trash2, XCircle } from "lucide-react";
import { PageHeader } from "@/components/page-header";
import { EmptyState, ErrorState, LoadingState } from "@/components/data-state";
import { Button, Pill } from "@/components/ui";
import { authApi } from "@/lib/api";
import { useApi } from "@/lib/use-api";
import type { User } from "@/lib/types";
import { useLanguage } from "@/lib/i18n";
import { useAuth } from "@/features/auth/auth-provider";

export default function AdminUsersPage() {
  const { t } = useLanguage();
  const { user: currentUser } = useAuth();
  const { data, error, loading } = useApi(() => authApi.getAll(), []);
  const [users, setUsers] = useState<User[] | null>(null);
  const [working, setWorking] = useState<number | null>(null);
  const visibleUsers = users ?? data ?? [];

  async function toggleActive(user: User) {
    if (!user.id || user.role === "admin") {
      return;
    }
    setWorking(user.id);
    try {
      const updated = await authApi.updateActive({ ...user, active: !user.active });
      setUsers((current) => (current ?? visibleUsers).map((item) => (item.id === updated.id ? updated : item)));
    } finally {
      setWorking(null);
    }
  }

  async function deleteUser(id?: number) {
    if (!id) {
      return;
    }
    const target = visibleUsers.find((item) => item.id === id);
    if (target?.role === "admin") {
      return;
    }
    setWorking(id);
    try {
      await authApi.delete(id);
      setUsers((current) => (current ?? visibleUsers).filter((item) => item.id !== id));
    } finally {
      setWorking(null);
    }
  }

  return (
    <div>
      <PageHeader eyebrow={t("nav.admin")} title={t("admin.usersTitle")} description={t("admin.usersDescription")} />
      {loading ? <LoadingState /> : null}
      {error ? <ErrorState message={error} /> : null}
      {!loading && visibleUsers.length === 0 ? <EmptyState title={t("admin.noUsers")} description={t("admin.noUsersDescription")} /> : null}
      {visibleUsers.length > 0 ? (
        <div className="overflow-hidden rounded-md border border-line bg-white shadow-soft">
          <table className="w-full border-collapse text-left text-sm">
            <thead className="bg-canvas text-xs uppercase tracking-wide text-muted">
              <tr>
                <th className="px-4 py-3">User</th>
                <th className="px-4 py-3">Role</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {visibleUsers.map((user) => {
                const protectedAdmin = user.role === "admin";
                const isSelf = currentUser?.id === user.id;
                return (
                <tr key={user.id}>
                  <td className="px-4 py-3">
                    <p className="font-semibold text-ink">{user.name || "Unnamed user"}</p>
                    <p className="text-muted">{user.email}</p>
                  </td>
                  <td className="px-4 py-3">
                    <Pill tone={protectedAdmin ? "orange" : "blue"}>{roleLabel(user.role)}</Pill>
                  </td>
                  <td className="px-4 py-3">
                    <span className="inline-flex items-center gap-1 text-muted">
                      {user.active ? <CheckCircle2 className="h-4 w-4 text-accent" /> : <XCircle className="h-4 w-4 text-warn" />}
                      {user.active ? "Active" : "Inactive"}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex justify-end gap-2">
                      <Button type="button" variant="secondary" onClick={() => toggleActive(user)} disabled={protectedAdmin || working === user.id}>
                        {user.active ? "Disable" : "Enable"}
                      </Button>
                      <Button type="button" variant="danger" onClick={() => deleteUser(user.id)} disabled={protectedAdmin || working === user.id} aria-label="Delete user">
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </td>
                </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      ) : null}
    </div>
  );
}

function roleLabel(role?: string) {
  if (role === "admin") {
    return "System Admin";
  }
  if (role === "hr") {
    return "HR";
  }
  return role ? role.charAt(0).toUpperCase() + role.slice(1) : "User";
}
