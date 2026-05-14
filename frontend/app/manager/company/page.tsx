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
import { useLanguage } from "@/lib/i18n";

export default function ManagerCompanyPage() {
  const { user } = useAuth();
  const { t } = useLanguage();
  const role = user?.role?.toLowerCase();
  const company = useApi(
    () => (role === "manager" ? companyApi.myManagedCompany().catch(() => (user?.id ? companyApi.byManager(user.id) : Promise.reject(new Error("No manager")))) : Promise.resolve(null)),
    [role, user?.id]
  );
  const [created, setCreated] = useState<Company | null>(null);
  const [draft, setDraft] = useState<Company | null>(null);
  const activeCompany = created ?? draft ?? company.data;

  if (role === "hr") {
    return <EmptyState title={t("manager.companyManagerOnly")} description={t("manager.companyManagerOnlyDescription")} />;
  }

  return (
    <div className="grid gap-6 xl:grid-cols-[0.9fr_1.1fr]">
      <section>
        <PageHeader eyebrow={t("companies.formEyebrow")} title={t("companies.createTitle")} description={t("companies.createDescription")} />
        <CompanyForm managerId={user?.id} onSaved={setCreated} onDraft={setDraft} />
      </section>
      <section>
        <PageHeader eyebrow={t("manager.current")} title={t("manager.managedCompany")} description={t("manager.managedCompanyDescription")} />
        {company.loading ? <LoadingState /> : null}
        {company.error ? <ErrorState message={company.error} /> : null}
        {!company.loading && !activeCompany ? <EmptyState title={t("manager.noCompanyAssigned")} description={t("manager.noCompanyAssignedDescription")} /> : null}
        {activeCompany ? <CompanyPreview company={activeCompany} /> : null}
      </section>
    </div>
  );
}

function CompanyPreview({ company }: { company: Company }) {
  const { t } = useLanguage();
  const location = [company.street, company.city, company.country].filter(Boolean).join(", ");
  const initials = (company.name || t("common.company")).slice(0, 2).toUpperCase();

  return (
    <article className="glass-panel interactive-card scroll-reveal rounded-md p-5">
      <div className="flex flex-col gap-5 sm:flex-row">
        <div className="flex h-28 w-28 shrink-0 items-center justify-center overflow-hidden rounded-md border border-line bg-canvas text-2xl font-bold text-brand">
          {company.url ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={company.url} alt={`${company.name || t("common.company")} logo`} className="h-full w-full object-cover" />
          ) : (
            initials
          )}
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <h2 className="text-2xl font-semibold text-ink">{company.name || t("manager.companyPreview")}</h2>
            <Pill tone="orange">{company.type || t("common.company")}</Pill>
          </div>
          <p className="mt-3 text-sm leading-6 text-muted">{company.description || t("manager.companyPreviewDescription")}</p>
        </div>
      </div>
      <dl className="mt-5 grid gap-3 text-sm md:grid-cols-3">
        <div className="flex gap-2 rounded-md bg-canvas p-3">
          <Mail className="mt-0.5 h-4 w-4 text-brand" />
          <div>
            <dt className="font-semibold text-ink">{t("companies.emailLabel")}</dt>
            <dd className="break-all text-muted">{company.email || t("common.notSet")}</dd>
          </div>
        </div>
        <div className="flex gap-2 rounded-md bg-canvas p-3">
          <Phone className="mt-0.5 h-4 w-4 text-brand" />
          <div>
            <dt className="font-semibold text-ink">{t("companies.phoneLabel")}</dt>
            <dd className="text-muted">{company.phone || t("common.notSet")}</dd>
          </div>
        </div>
        <div className="flex gap-2 rounded-md bg-canvas p-3">
          <MapPin className="mt-0.5 h-4 w-4 text-brand" />
          <div>
            <dt className="font-semibold text-ink">{t("common.location")}</dt>
            <dd className="text-muted">{location || t("common.notSet")}</dd>
          </div>
        </div>
      </dl>
      <div className="mt-4 flex flex-wrap gap-2 text-sm">
        <Pill tone="blue">
          <Building2 className="mr-1 inline h-3.5 w-3.5" />
          {t("nav.manager")} #{company.idManager ?? t("manager.managerUnassigned")}
        </Pill>
        <Pill tone="green">{company.idHR?.length ?? 0} HR</Pill>
      </div>
    </article>
  );
}
