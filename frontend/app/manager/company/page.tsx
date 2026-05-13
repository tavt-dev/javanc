"use client";

import { useState } from "react";
import { Building2, Mail, MapPin, Phone } from "lucide-react";
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
  const company = useApi(() => companyApi.myManagedCompany().catch(() => (user?.id ? companyApi.byManager(user.id) : Promise.reject(new Error("No manager")))), [user?.id]);
  const [created, setCreated] = useState<Company | null>(null);
  const [draft, setDraft] = useState<Company | null>(null);
  const activeCompany = created ?? draft ?? company.data;

  return (
    <div className="grid gap-6 xl:grid-cols-[0.9fr_1.1fr]">
      <section>
        <PageHeader eyebrow="Company" title="Create company" description="Add company details, contact information, location, and logo." />
        <CompanyForm managerId={user?.id} onSaved={setCreated} onDraft={setDraft} />
      </section>
      <section>
        <PageHeader eyebrow="Current" title="Managed company" />
        {company.loading ? <LoadingState /> : null}
        {company.error ? <ErrorState message={company.error} /> : null}
        {!company.loading && !activeCompany ? <EmptyState title="No company assigned" description="Create or assign a company to this manager." /> : null}
        {activeCompany ? <CompanyPreview company={activeCompany} /> : null}
      </section>
    </div>
  );
}

function CompanyPreview({ company }: { company: Company }) {
  const location = [company.street, company.city, company.country].filter(Boolean).join(", ");
  const initials = (company.name || "Company").slice(0, 2).toUpperCase();

  return (
    <article className="interactive-card rounded-md border border-line bg-white p-5 shadow-soft">
      <div className="flex flex-col gap-5 sm:flex-row">
        <div className="flex h-28 w-28 shrink-0 items-center justify-center overflow-hidden rounded-md border border-line bg-canvas text-2xl font-bold text-brand">
          {company.url ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={company.url} alt={`${company.name || "Company"} logo`} className="h-full w-full object-cover" />
          ) : (
            initials
          )}
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <h2 className="text-2xl font-semibold text-ink">{company.name || "Company preview"}</h2>
            <Pill tone="orange">{company.type || "Company"}</Pill>
          </div>
          <p className="mt-3 text-sm leading-6 text-muted">{company.description || "Company description will appear here."}</p>
        </div>
      </div>
      <dl className="mt-5 grid gap-3 text-sm md:grid-cols-3">
        <div className="flex gap-2 rounded-md bg-canvas p-3">
          <Mail className="mt-0.5 h-4 w-4 text-brand" />
          <div>
            <dt className="font-semibold text-ink">Email</dt>
            <dd className="break-all text-muted">{company.email || "Not set"}</dd>
          </div>
        </div>
        <div className="flex gap-2 rounded-md bg-canvas p-3">
          <Phone className="mt-0.5 h-4 w-4 text-brand" />
          <div>
            <dt className="font-semibold text-ink">Phone</dt>
            <dd className="text-muted">{company.phone || "Not set"}</dd>
          </div>
        </div>
        <div className="flex gap-2 rounded-md bg-canvas p-3">
          <MapPin className="mt-0.5 h-4 w-4 text-brand" />
          <div>
            <dt className="font-semibold text-ink">Location</dt>
            <dd className="text-muted">{location || "Not set"}</dd>
          </div>
        </div>
      </dl>
      <div className="mt-4 flex flex-wrap gap-2 text-sm">
        <Pill tone="blue">
          <Building2 className="mr-1 inline h-3.5 w-3.5" />
          Manager #{company.idManager ?? "unassigned"}
        </Pill>
        <Pill tone="green">{company.idHR?.length ?? 0} HR</Pill>
      </div>
    </article>
  );
}
