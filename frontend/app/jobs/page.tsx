"use client";

import Link from "next/link";
import { PageHeader } from "@/components/page-header";
import { EmptyState, ErrorState, LoadingState } from "@/components/data-state";
import { Pill } from "@/components/ui";
import { jobApi } from "@/lib/api";
import { useApi } from "@/lib/use-api";
import { useLanguage } from "@/lib/i18n";

export default function JobsPage() {
  const { t } = useLanguage();
  const { data, error, loading } = useApi(() => jobApi.list(), []);

  return (
    <div>
      <PageHeader eyebrow={t("jobs.eyebrow")} title={t("jobs.title")} description={t("jobs.description")} />
      {loading ? <LoadingState /> : null}
      {error ? <ErrorState message={error} /> : null}
      {!loading && data?.length === 0 ? <EmptyState title={t("jobs.emptyTitle")} description={t("jobs.emptyDescription")} /> : null}
      <div className="grid gap-4 md:grid-cols-2">
        {data?.map((job) => (
          <Link key={job.id} href={`/jobs/${job.id}`} className="rounded-md border border-line bg-white p-5 shadow-soft hover:border-brand">
            <div className="flex items-start justify-between gap-3">
              <h2 className="font-semibold text-ink">{job.title || t("state.untitledJob")}</h2>
              <Pill tone="green">{job.typeJob || "Job"}</Pill>
            </div>
            <p className="mt-3 line-clamp-3 text-sm text-muted">{job.description || t("state.noDescription")}</p>
            <p className="mt-4 text-xs font-semibold uppercase tracking-wide text-muted">{t("jobs.company")} #{job.idCompany ?? t("state.unknown")}</p>
          </Link>
        ))}
      </div>
    </div>
  );
}
