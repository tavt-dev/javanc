"use client";

import { PageHeader } from "@/components/page-header";
import { EmptyState, ErrorState, LoadingState } from "@/components/data-state";
import { Pill } from "@/components/ui";
import { authApi } from "@/lib/api";
import { useApi } from "@/lib/use-api";
import { useLanguage } from "@/lib/i18n";

export default function ManagerEmployeesPage() {
  const { t } = useLanguage();
  const { data, error, loading } = useApi(() => authApi.getAll(), []);
  const employees = data?.filter((user) => ["user", "hr", "manager"].includes((user.role ?? "").toLowerCase())) ?? [];

  return (
    <div>
      <PageHeader eyebrow={t("manager.peopleEyebrow")} title={t("manager.employeesTitle")} description={t("manager.employeesDescription")} />
      {loading ? <LoadingState /> : null}
      {error ? <ErrorState message={error} /> : null}
      {!loading && employees.length === 0 ? <EmptyState title={t("manager.noEmployees")} description={t("manager.noEmployeesDescription")} /> : null}
      <div className="grid gap-4 md:grid-cols-2">
        {employees.map((user) => (
          <article key={user.id} className="rounded-md border border-line bg-white p-5 shadow-soft">
            <div className="flex items-start justify-between gap-3">
              <div>
                <h2 className="font-semibold text-ink">{user.name || t("state.unknown")}</h2>
                <p className="mt-1 text-sm text-muted">{user.email}</p>
              </div>
              <Pill tone="blue">{user.role || "user"}</Pill>
            </div>
          </article>
        ))}
      </div>
    </div>
  );
}
