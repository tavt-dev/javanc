"use client";

import { useState } from "react";
import { PageHeader } from "@/components/page-header";
import { EmptyState, ErrorState, LoadingState } from "@/components/data-state";
import { Button, Pill } from "@/components/ui";
import { JobForm } from "@/features/jobs/job-form";
import { jobApi } from "@/lib/api";
import { useApi } from "@/lib/use-api";
import type { Job } from "@/lib/types";

export default function ManagerJobsPage() {
  const { data, error, loading } = useApi(() => jobApi.list(), []);
  const [created, setCreated] = useState<Job[]>([]);
  const [working, setWorking] = useState<number | null>(null);
  const jobs = [...created, ...(data ?? [])];

  async function deleteJob(id?: number) {
    if (!id) {
      return;
    }
    setWorking(id);
    try {
      await jobApi.delete(id);
      setCreated((items) => items.filter((job) => job.id !== id));
    } finally {
      setWorking(null);
    }
  }

  return (
    <div className="grid gap-6 xl:grid-cols-[0.85fr_1.15fr]">
      <section>
        <PageHeader eyebrow="HR" title="Create job" description="Posts to `/manager/hr/job/create`." />
        <JobForm onSaved={(job) => setCreated((items) => [job, ...items])} />
      </section>
      <section>
        <PageHeader eyebrow="Manager" title="Job board" />
        {loading ? <LoadingState /> : null}
        {error ? <ErrorState message={error} /> : null}
        {!loading && jobs.length === 0 ? <EmptyState title="No jobs" description="Create a job to start receiving applications." /> : null}
        <div className="grid gap-4">
          {jobs.map((job, index) => (
            <article key={`${job.id ?? "new"}-${index}`} className="rounded-md border border-line bg-white p-5 shadow-soft">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h2 className="font-semibold text-ink">{job.title || "Untitled job"}</h2>
                  <p className="mt-2 text-sm text-muted">{job.description || "No description"}</p>
                </div>
                <Pill tone="green">{job.typeJob || "Job"}</Pill>
              </div>
              <div className="mt-4 flex items-center justify-between gap-3 text-sm text-muted">
                <span>Company #{job.idCompany ?? "unknown"}</span>
                <Button type="button" variant="danger" onClick={() => deleteJob(job.id)} disabled={working === job.id}>
                  Delete
                </Button>
              </div>
            </article>
          ))}
        </div>
      </section>
    </div>
  );
}
