"use client";

import { PageHeader } from "@/components/page-header";
import { EmptyState, ErrorState, LoadingState } from "@/components/data-state";
import { Pill } from "@/components/ui";
import { companyApi } from "@/lib/api";
import { useApi } from "@/lib/use-api";
import { useLanguage } from "@/lib/i18n";

export default function CompaniesPage() {
  const { t } = useLanguage();
  const { data, error, loading } = useApi(() => companyApi.list(), []);

  return (
    <div>
      <PageHeader eyebrow={t("companies.eyebrow")} title={t("companies.title")} description={t("companies.description")} />
      {loading ? <LoadingState /> : null}
      {error ? <ErrorState message={error} /> : null}
      {!loading && data?.length === 0 ? <EmptyState title={t("companies.emptyTitle")} description={t("companies.emptyDescription")} /> : null}
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {data?.map((company) => (
          <article key={company.id} className="rounded-md border border-line bg-white p-5 shadow-soft">
            <div className="flex items-start justify-between gap-3">
              <h2 className="font-semibold text-ink">{company.name || t("state.unnamedCompany")}</h2>
              <Pill tone="orange">{company.type || "Company"}</Pill>
            </div>
            <p className="mt-3 line-clamp-3 text-sm text-muted">{company.description || t("state.noCompanyDescription")}</p>
            <p className="mt-4 text-sm text-muted">{[company.city, company.country].filter(Boolean).join(", ") || t("state.locationNotSet")}</p>
          </article>
        ))}
      </div>
    </div>
  );
}
