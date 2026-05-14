"use client";

import { useEffect, useState } from "react";
import { CheckCircle2, Search, Trash2, XCircle } from "lucide-react";
import { PageHeader } from "@/components/page-header";
import { EmptyState, ErrorState, LoadingState } from "@/components/data-state";
import { Button, PaginationControls, Pill, inputClass } from "@/components/ui";
import { authApi } from "@/lib/api";
import { useApi } from "@/lib/use-api";
import type { User } from "@/lib/types";
import { useLanguage } from "@/lib/i18n";
import { useAuth } from "@/features/auth/auth-provider";

const PAGE_SIZE = 10;

export default function AdminUsersPage() {
  const { t } = useLanguage();
  const { user: currentUser } = useAuth();
  const [query, setQuery] = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState("");
  const [roleFilter, setRoleFilter] = useState("");
  const [page, setPage] = useState(0);
  const { data, error, loading } = useApi(
    () => authApi.search({ query: debouncedQuery || undefined, role: roleFilter || undefined, page, size: PAGE_SIZE }),
    [debouncedQuery, roleFilter, page]
  );
  const [users, setUsers] = useState<User[] | null>(null);
  const [working, setWorking] = useState<number | null>(null);
  const visibleUsers = users ?? data ?? [];

  useEffect(() => {
    const timeoutId = window.setTimeout(() => setDebouncedQuery(query.trim()), 250);
    return () => window.clearTimeout(timeoutId);
  }, [query]);

  useEffect(() => {
    setPage(0);
  }, [debouncedQuery, roleFilter]);

  useEffect(() => {
    setUsers(null);
  }, [data]);

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
      <div className="mb-5 grid gap-3 rounded-md border border-line bg-white p-3 shadow-soft md:grid-cols-[1fr_180px]">
        <div className="flex items-center gap-3">
          <Search className="h-4 w-4 text-muted" />
          <input
            className="h-10 flex-1 border-0 bg-transparent text-sm text-ink outline-none placeholder:text-slate-400"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search users"
          />
        </div>
        <select className={inputClass} value={roleFilter} onChange={(event) => setRoleFilter(event.target.value)}>
          <option value="">All roles</option>
          <option value="user">User</option>
          <option value="manager">Manager</option>
          <option value="hr">HR</option>
          <option value="admin">Admin</option>
        </select>
      </div>
      {loading ? <LoadingState /> : null}
      {error ? <ErrorState message={error} /> : null}
      {!loading && visibleUsers.length === 0 ? <EmptyState title={t("admin.noUsers")} description={t("admin.noUsersDescription")} /> : null}
      {visibleUsers.length > 0 ? (
        <div className="overflow-hidden rounded-md border border-line bg-white shadow-soft">
          <table className="w-full border-collapse text-left text-sm">
            <thead className="bg-canvas text-xs uppercase tracking-wide text-muted">
              <tr>
                <th className="px-4 py-3">{t("admin.user")}</th>
                <th className="px-4 py-3">{t("admin.role")}</th>
                <th className="px-4 py-3">{t("admin.status")}</th>
                <th className="px-4 py-3 text-right">{t("admin.actions")}</th>
              </tr>
            </thead>
            <tbody key={`${page}-${roleFilter}-${debouncedQuery}`} className="page-list-enter divide-y divide-line">
              {visibleUsers.map((user) => {
                const protectedAdmin = user.role === "admin";
                const isSelf = currentUser?.id === user.id;
                return (
                <tr key={user.id}>
                  <td className="px-4 py-3">
                    <p className="font-semibold text-ink">{user.name || t("admin.unnamedUser")}</p>
                    <p className="text-muted">{user.email}</p>
                  </td>
                  <td className="px-4 py-3">
                    <Pill tone={protectedAdmin ? "orange" : "blue"}>{roleLabel(user.role, t)}</Pill>
                  </td>
                  <td className="px-4 py-3">
                    <span className="inline-flex items-center gap-1 text-muted">
                      {user.active ? <CheckCircle2 className="h-4 w-4 text-accent" /> : <XCircle className="h-4 w-4 text-warn" />}
                      {user.active ? t("admin.active") : t("admin.inactive")}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex justify-end gap-2">
                      <Button type="button" variant="secondary" onClick={() => toggleActive(user)} disabled={protectedAdmin || working === user.id}>
                        {user.active ? t("admin.disable") : t("admin.enable")}
                      </Button>
                      <Button type="button" variant="danger" onClick={() => deleteUser(user.id)} disabled={protectedAdmin || working === user.id} aria-label={t("admin.deleteUser")}>
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
      <PaginationControls page={page} canNext={(data?.length ?? 0) === PAGE_SIZE} onPageChange={setPage} />
    </div>
  );
}

function roleLabel(role: string | undefined, t: (key: string) => string) {
  if (role === "admin") {
    return t("account.systemAdmin");
  }
  if (role === "hr") {
    return "HR";
  }
  return role ? role.charAt(0).toUpperCase() + role.slice(1) : t("auth.userRole");
}
