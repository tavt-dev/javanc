"use client";

import { PageHeader } from "@/components/page-header";
import { EmptyState, ErrorState, LoadingState } from "@/components/data-state";
import { Pill } from "@/components/ui";
import { companyApi } from "@/lib/api";
import { useApi } from "@/lib/use-api";

export default function CompaniesPage() {
  const { data, error, loading } = useApi(() => companyApi.list(), []);

  return (
    <div>
      <PageHeader eyebrow="Companies" title="Company directory" description="Explore organizations, locations, and hiring teams." />
      {loading ? <LoadingState /> : null}
      {error ? <ErrorState message={error} /> : null}
      {!loading && data?.length === 0 ? <EmptyState title="No companies" description="Create companies from the manager workspace." /> : null}
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {data?.map((company) => (
          <article key={company.id} className="rounded-md border border-line bg-white p-5 shadow-soft">
            <div className="flex items-start justify-between gap-3">
              <h2 className="font-semibold text-ink">{company.name || "Unnamed company"}</h2>
              <Pill tone="orange">{company.type || "Company"}</Pill>
            </div>
            <p className="mt-3 line-clamp-3 text-sm text-muted">{company.description || "No company description"}</p>
            <p className="mt-4 text-sm text-muted">{[company.city, company.country].filter(Boolean).join(", ") || "Location not set"}</p>
          </article>
        ))}
      </div>
    </div>
  );
}
