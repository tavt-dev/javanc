"use client";

import { useState } from "react";
import { PageHeader } from "@/components/page-header";
import { EmptyState, ErrorState, LoadingState } from "@/components/data-state";
import { Button, Pill } from "@/components/ui";
import { authApi, companyApi } from "@/lib/api";
import { useApi } from "@/lib/use-api";
import { useLanguage } from "@/lib/i18n";
import type { User } from "@/lib/types";
import { useAuth } from "@/features/auth/auth-provider";

export default function ManagerEmployeesPage() {
  const { t } = useLanguage();
  const { user } = useAuth();
  const { data, error, loading } = useApi(() => authApi.getAll(), []);
  const company = useApi(() => (user?.id ? companyApi.byManager(user.id).catch(() => null) : Promise.resolve(null)), [user?.id]);
  const [users, setUsers] = useState<User[] | null>(null);
  const [working, setWorking] = useState<number | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const employees = (users ?? data ?? []).filter((user) => ["user", "hr", "manager"].includes((user.role ?? "").toLowerCase()));

  async function promoteToHr(user: User) {
    if (!user.id) {
      return;
    }
    setWorking(user.id);
    setActionError(null);
    try {
      if (!company.data?.id) {
        throw new Error("No company assigned to this manager.");
      }
      await companyApi.promoteHr(user.id, company.data.id);
      const updated = { ...user, role: "hr" };
      setUsers((current) => (current ?? data ?? []).map((item) => (item.id === updated.id ? updated : item)));
    } catch (err) {
      setActionError(err instanceof Error ? err.message : "Unable to promote user");
    } finally {
      setWorking(null);
    }
  }

  return (
    <div>
      <PageHeader eyebrow={t("manager.peopleEyebrow")} title={t("manager.employeesTitle")} description={t("manager.employeesDescription")} />
      {loading ? <LoadingState /> : null}
      {error ? <ErrorState message={error} /> : null}
      {actionError ? <ErrorState message={actionError} /> : null}
      {!loading && employees.length === 0 ? <EmptyState title={t("manager.noEmployees")} description={t("manager.noEmployeesDescription")} /> : null}
      <div className="grid gap-4 md:grid-cols-2">
        {employees.map((user) => (
          <article key={user.id} className="rounded-md border border-line bg-white p-5 shadow-soft">
            <div className="flex items-start justify-between gap-3">
              <div>
                <h2 className="font-semibold text-ink">{user.name || t("state.unknown")}</h2>
                <p className="mt-1 text-sm text-muted">{user.email}</p>
              </div>
              <div className="flex flex-col items-end gap-3">
                <Pill tone="blue">{user.role || "user"}</Pill>
                {(user.role ?? "user") === "user" ? (
                  <Button type="button" variant="secondary" onClick={() => promoteToHr(user)} disabled={working === user.id || company.loading || !company.data?.id}>
                    Promote to HR
                  </Button>
                ) : null}
              </div>
            </div>
          </article>
        ))}
      </div>
    </div>
  );
}
