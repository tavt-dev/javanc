"use client";

import Link from "next/link";
import { PageHeader } from "@/components/page-header";
import { EmptyState, ErrorState, LoadingState } from "@/components/data-state";
import { Pill } from "@/components/ui";
import { jobApi } from "@/lib/api";
import { useApi } from "@/lib/use-api";

export default function JobsPage() {
  const { data, error, loading } = useApi(() => jobApi.list(), []);

  return (
    <div>
      <PageHeader eyebrow="Jobs" title="Job opportunities" description="Browse open jobs and apply with a profile id." />
      {loading ? <LoadingState /> : null}
      {error ? <ErrorState message={error} /> : null}
      {!loading && data?.length === 0 ? <EmptyState title="No jobs" description="Jobs will appear when HR creates them." /> : null}
      <div className="grid gap-4 md:grid-cols-2">
        {data?.map((job) => (
          <Link key={job.id} href={`/jobs/${job.id}`} className="rounded-md border border-line bg-white p-5 shadow-soft hover:border-brand">
            <div className="flex items-start justify-between gap-3">
              <h2 className="font-semibold text-ink">{job.title || "Untitled job"}</h2>
              <Pill tone="green">{job.typeJob || "Job"}</Pill>
            </div>
            <p className="mt-3 line-clamp-3 text-sm text-muted">{job.description || "No description"}</p>
            <p className="mt-4 text-xs font-semibold uppercase tracking-wide text-muted">Company #{job.idCompany ?? "unknown"}</p>
          </Link>
        ))}
      </div>
    </div>
  );
}
