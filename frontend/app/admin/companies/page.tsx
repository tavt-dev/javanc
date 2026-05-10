"use client";

import { useState } from "react";
import { PageHeader } from "@/components/page-header";
import { EmptyState, ErrorState, LoadingState } from "@/components/data-state";
import { Button, Pill } from "@/components/ui";
import { companyApi } from "@/lib/api";
import { useApi } from "@/lib/use-api";
import type { Company } from "@/lib/types";

export default function AdminCompaniesPage() {
  const { data, error, loading } = useApi(() => companyApi.list(), []);
  const [companies, setCompanies] = useState<Company[] | null>(null);
  const visibleCompanies = companies ?? data ?? [];

  async function deleteCompany(id?: number) {
    if (!id) {
      return;
    }
    await companyApi.delete(id);
    setCompanies((current) => (current ?? visibleCompanies).filter((company) => company.id !== id));
  }

  return (
    <div>
      <PageHeader eyebrow="Admin" title="Company management" description="Review company records and remove outdated organizations." />
      {loading ? <LoadingState /> : null}
      {error ? <ErrorState message={error} /> : null}
      {!loading && visibleCompanies.length === 0 ? <EmptyState title="No companies" description="Companies will appear here after creation." /> : null}
      <div className="grid gap-4 md:grid-cols-2">
        {visibleCompanies.map((company) => (
          <article key={company.id} className="rounded-md border border-line bg-white p-5 shadow-soft">
            <div className="flex items-start justify-between gap-3">
              <div>
                <h2 className="font-semibold text-ink">{company.name}</h2>
                <p className="mt-1 text-sm text-muted">{company.email || "No email"}</p>
              </div>
              <Pill tone="orange">{company.type || "Company"}</Pill>
            </div>
            <p className="mt-3 line-clamp-2 text-sm text-muted">{company.description || "No description"}</p>
            <div className="mt-4 flex justify-end">
              <Button type="button" variant="danger" onClick={() => deleteCompany(company.id)}>
                Delete
              </Button>
            </div>
          </article>
        ))}
      </div>
    </div>
  );
}
