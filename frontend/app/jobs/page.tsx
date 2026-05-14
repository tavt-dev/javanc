"use client";

import { useEffect, useMemo, useState } from "react";
import { Search } from "lucide-react";
import { PageHeader } from "@/components/page-header";
import { EmptyState, ErrorState, LoadingState } from "@/components/data-state";
import { JobPreviewCard } from "@/components/item-previews";
import { PaginationControls, inputClass } from "@/components/ui";
import { companyApi, jobApi, type ListingSort } from "@/lib/api";
import { useApi } from "@/lib/use-api";
import { useLanguage } from "@/lib/i18n";

const PAGE_SIZE = 10;

export default function JobsPage() {
  const { t } = useLanguage();
  const [query, setQuery] = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState("");
  const [sort, setSort] = useState<ListingSort>("hot");
  const [page, setPage] = useState(0);
  const { data, error, loading } = useApi(
    () => jobApi.list({ query: debouncedQuery || undefined, page, size: PAGE_SIZE, sort }),
    [debouncedQuery, page, sort]
  );
  const companies = useApi(() => companyApi.list({ page: 0, size: 100, sort: "hot" }), []);
  const companyById = useMemo(() => new Map((companies.data ?? []).map((company) => [company.id, company])), [companies.data]);

  useEffect(() => {
    const timeoutId = window.setTimeout(() => setDebouncedQuery(query.trim()), 250);
    return () => window.clearTimeout(timeoutId);
  }, [query]);

  useEffect(() => {
    setPage(0);
  }, [debouncedQuery, sort]);

  return (
    <div>
      <PageHeader eyebrow={t("jobs.eyebrow")} title={t("jobs.title")} description={t("jobs.description")} />
      <div className="mb-5 grid gap-3 rounded-md border border-line bg-white p-3 shadow-soft md:grid-cols-[1fr_180px]">
        <div className="flex items-center gap-3">
          <Search className="h-4 w-4 text-muted" />
          <input
            className="h-10 flex-1 border-0 bg-transparent text-sm text-ink outline-none placeholder:text-slate-400"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder={t("jobs.searchPlaceholder")}
          />
        </div>
        <select className={inputClass} value={sort} onChange={(event) => setSort(event.target.value as ListingSort)}>
          <option value="hot">Hot first</option>
          <option value="newest">Newest first</option>
        </select>
      </div>
      {loading ? <LoadingState /> : null}
      {error ? <ErrorState message={error} /> : null}
      {!loading && data?.length === 0 ? <EmptyState title={t("jobs.emptyTitle")} description={t("jobs.emptyDescription")} /> : null}
      <div key={`${page}-${sort}-${debouncedQuery}`} className="page-list-enter grid gap-4 md:grid-cols-2">
        {data?.map((job) => {
          const company = companyById.get(job.idCompany);
          return (
            <JobPreviewCard key={job.id} job={job} company={company} href={`/jobs/${job.id}`} />
          );
        })}
      </div>
      <PaginationControls page={page} canNext={(data?.length ?? 0) === PAGE_SIZE} onPageChange={setPage} />
    </div>
  );
}
