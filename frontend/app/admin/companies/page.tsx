"use client";

import { useEffect, useState } from "react";
import { PageHeader } from "@/components/page-header";
import { EmptyState, ErrorState, LoadingState } from "@/components/data-state";
import { Button, PaginationControls, Pill, inputClass } from "@/components/ui";
import { companyApi, type ListingSort } from "@/lib/api";
import { useApi } from "@/lib/use-api";
import type { Company } from "@/lib/types";
import { useLanguage } from "@/lib/i18n";

const PAGE_SIZE = 10;

export default function AdminCompaniesPage() {
  const { t } = useLanguage();
  const [sort, setSort] = useState<ListingSort>("hot");
  const [page, setPage] = useState(0);
  const { data, error, loading } = useApi(() => companyApi.list({ page, size: PAGE_SIZE, sort }), [page, sort]);
  const [companies, setCompanies] = useState<Company[] | null>(null);
  const visibleCompanies = companies ?? data ?? [];

  useEffect(() => {
    setPage(0);
  }, [sort]);

  useEffect(() => {
    setCompanies(null);
  }, [data]);

  async function deleteCompany(id?: number) {
    if (!id) {
      return;
    }
    await companyApi.delete(id);
    setCompanies((current) => (current ?? visibleCompanies).filter((company) => company.id !== id));
  }

  return (
    <div>
      <PageHeader eyebrow={t("nav.admin")} title={t("admin.companyManagement")} description={t("admin.companyManagementDescription")} />
      <div className="mb-5 flex justify-end">
        <select className={`${inputClass} max-w-48`} value={sort} onChange={(event) => setSort(event.target.value as ListingSort)}>
          <option value="hot">Hot first</option>
          <option value="newest">Newest first</option>
        </select>
      </div>
      {loading ? <LoadingState /> : null}
      {error ? <ErrorState message={error} /> : null}
      {!loading && visibleCompanies.length === 0 ? <EmptyState title={t("companies.emptyTitle")} description={t("admin.noCompaniesDescription")} /> : null}
      <div key={`${page}-${sort}`} className="page-list-enter grid gap-4 md:grid-cols-2">
        {visibleCompanies.map((company) => (
          <article key={company.id} className="rounded-md border border-line bg-white p-5 shadow-soft">
            <div className="flex items-start justify-between gap-3">
              <div>
                <h2 className="font-semibold text-ink">{company.name}</h2>
                <p className="mt-1 text-sm text-muted">{company.email || t("admin.noEmail")}</p>
              </div>
              <Pill tone="orange">{company.type || t("common.company")}</Pill>
            </div>
            <p className="mt-3 line-clamp-2 text-sm text-muted">{company.description || t("state.noDescription")}</p>
            <div className="mt-4 flex justify-end">
              <Button type="button" variant="danger" onClick={() => deleteCompany(company.id)}>
                {t("common.delete")}
              </Button>
            </div>
          </article>
        ))}
      </div>
      <PaginationControls page={page} canNext={(data?.length ?? 0) === PAGE_SIZE} onPageChange={setPage} />
    </div>
  );
}
