"use client";

import { PageHeader } from "@/components/page-header";
import { EmptyState, ErrorState, LoadingState } from "@/components/data-state";
import { Pill } from "@/components/ui";
import { authApi } from "@/lib/api";
import { useApi } from "@/lib/use-api";

export default function ManagerEmployeesPage() {
  const { data, error, loading } = useApi(() => authApi.getAll(), []);
  const employees = data?.filter((user) => user.role === "USER" || user.role === "HR" || user.role === "MANAGER") ?? [];

  return (
    <div>
      <PageHeader eyebrow="People" title="Employees" description="Clean replacement for the old `/manager/emloyee` route." />
      {loading ? <LoadingState /> : null}
      {error ? <ErrorState message={error} /> : null}
      {!loading && employees.length === 0 ? <EmptyState title="No employees" description="Users returned from auth will appear here." /> : null}
      <div className="grid gap-4 md:grid-cols-2">
        {employees.map((user) => (
          <article key={user.id} className="rounded-md border border-line bg-white p-5 shadow-soft">
            <div className="flex items-start justify-between gap-3">
              <div>
                <h2 className="font-semibold text-ink">{user.name || "Unnamed user"}</h2>
                <p className="mt-1 text-sm text-muted">{user.email}</p>
              </div>
              <Pill tone="blue">{user.role || "USER"}</Pill>
            </div>
          </article>
        ))}
      </div>
    </div>
  );
}
