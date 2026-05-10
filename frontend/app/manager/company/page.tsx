"use client";

import { useState } from "react";
import { PageHeader } from "@/components/page-header";
import { EmptyState, ErrorState, LoadingState } from "@/components/data-state";
import { Pill } from "@/components/ui";
import { CompanyForm } from "@/features/companies/company-form";
import { companyApi } from "@/lib/api";
import { useApi } from "@/lib/use-api";
import { useAuth } from "@/features/auth/auth-provider";
import type { Company } from "@/lib/types";

export default function ManagerCompanyPage() {
  const { user } = useAuth();
  const company = useApi(() => companyApi.byManager(user?.id), [user?.id]);
  const [created, setCreated] = useState<Company | null>(null);
  const activeCompany = created ?? company.data;

  return (
    <div className="grid gap-6 xl:grid-cols-[0.9fr_1.1fr]">
      <section>
        <PageHeader eyebrow="Company" title="Create company" description="Add company details, contact information, location, and logo." />
        <CompanyForm onSaved={setCreated} />
      </section>
      <section>
        <PageHeader eyebrow="Current" title="Managed company" />
        {company.loading ? <LoadingState /> : null}
        {company.error ? <ErrorState message={company.error} /> : null}
        {!company.loading && !activeCompany ? <EmptyState title="No company assigned" description="Create or assign a company to this manager." /> : null}
        {activeCompany ? (
          <article className="rounded-md border border-line bg-white p-5 shadow-soft">
            <div className="flex items-start justify-between gap-3">
              <h2 className="text-lg font-semibold text-ink">{activeCompany.name}</h2>
              <Pill tone="orange">{activeCompany.type || "Company"}</Pill>
            </div>
            <p className="mt-3 text-sm leading-6 text-muted">{activeCompany.description || "No description"}</p>
            <dl className="mt-5 grid gap-4 text-sm md:grid-cols-2">
              <div>
                <dt className="font-semibold text-ink">Email</dt>
                <dd className="text-muted">{activeCompany.email || "Not set"}</dd>
              </div>
              <div>
                <dt className="font-semibold text-ink">Location</dt>
                <dd className="text-muted">{[activeCompany.city, activeCompany.country].filter(Boolean).join(", ") || "Not set"}</dd>
              </div>
            </dl>
          </article>
        ) : null}
      </section>
    </div>
  );
}
