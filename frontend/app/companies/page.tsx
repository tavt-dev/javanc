"use client";

import { useEffect, useState } from "react";
import { Search } from "lucide-react";
import { PageHeader } from "@/components/page-header";
import { EmptyState, ErrorState, LoadingState } from "@/components/data-state";
import { CompanyPreviewCard } from "@/components/item-previews";
import { PaginationControls, inputClass } from "@/components/ui";
import { companyApi, type ListingSort } from "@/lib/api";
import { useApi } from "@/lib/use-api";
import { useLanguage } from "@/lib/i18n";

const PAGE_SIZE = 12;

export default function CompaniesPage() {
  const { t } = useLanguage();
  const [query, setQuery] = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState("");
  const [sort, setSort] = useState<ListingSort>("hot");
  const [page, setPage] = useState(0);
  const { data, error, loading } = useApi(
    () => companyApi.list({ query: debouncedQuery || undefined, page, size: PAGE_SIZE, sort }),
    [debouncedQuery, page, sort]
  );

  useEffect(() => {
    const timeoutId = window.setTimeout(() => setDebouncedQuery(query.trim()), 250);
    return () => window.clearTimeout(timeoutId);
  }, [query]);

  useEffect(() => {
    setPage(0);
  }, [debouncedQuery, sort]);

  return (
    <div>
      <PageHeader eyebrow={t("companies.eyebrow")} title={t("companies.title")} description={t("companies.description")} />
      <div className="mb-5 grid gap-3 rounded-md border border-line bg-white p-3 shadow-soft md:grid-cols-[1fr_180px]">
        <div className="flex items-center gap-3">
          <Search className="h-4 w-4 text-muted" />
          <input
            className="h-10 flex-1 border-0 bg-transparent text-sm text-ink outline-none placeholder:text-slate-400"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder={t("companies.searchPlaceholder")}
          />
        </div>
        <select className={inputClass} value={sort} onChange={(event) => setSort(event.target.value as ListingSort)}>
          <option value="hot">Hot first</option>
          <option value="newest">Newest first</option>
        </select>
      </div>
      {loading ? <LoadingState /> : null}
      {error ? <ErrorState message={error} /> : null}
      {!loading && data?.length === 0 ? <EmptyState title={t("companies.emptyTitle")} description={t("companies.emptyDescription")} /> : null}
      <div key={`${page}-${sort}-${debouncedQuery}`} className="page-list-enter grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {data?.map((company) => (
          <CompanyPreviewCard key={company.id} company={company} />
        ))}
      </div>
      <PaginationControls page={page} canNext={(data?.length ?? 0) === PAGE_SIZE} onPageChange={setPage} />
    </div>
  );
}
