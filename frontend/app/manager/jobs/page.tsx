"use client";

import { useState } from "react";
import { PageHeader } from "@/components/page-header";
import { EmptyState, ErrorState, LoadingState } from "@/components/data-state";
import { Button, Pill } from "@/components/ui";
import { JobForm } from "@/features/jobs/job-form";
import { jobApi, profileApi } from "@/lib/api";
import { useApi } from "@/lib/use-api";
import type { Job, Profile } from "@/lib/types";

export default function ManagerJobsPage() {
  const { data, error, loading } = useApi(() => jobApi.list(), []);
  const [created, setCreated] = useState<Job[]>([]);
  const [updated, setUpdated] = useState<Record<number, Job>>({});
  const [working, setWorking] = useState<number | null>(null);
  const jobs = [...created, ...(data ?? [])].map((job) => (job.id ? updated[job.id] ?? job : job));

  async function deleteJob(id?: number) {
    if (!id) {
      return;
    }
    setWorking(id);
    try {
      await jobApi.delete(id);
      setCreated((items) => items.filter((job) => job.id !== id));
      setUpdated((items) => {
        const next = { ...items };
        delete next[id];
        return next;
      });
    } finally {
      setWorking(null);
    }
  }

  async function reviewApplication(jobId: number | undefined, profileId: number, decision: "accept" | "reject") {
    if (!jobId) {
      return;
    }
    setWorking(jobId);
    try {
      const saved = decision === "accept" ? await jobApi.accept(jobId, profileId) : await jobApi.reject(jobId, profileId);
      setUpdated((items) => ({ ...items, [jobId]: saved }));
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
              <PendingApplicants job={job} disabled={working === job.id} onReview={reviewApplication} />
            </article>
          ))}
        </div>
      </section>
    </div>
  );
}

function PendingApplicants({
  job,
  disabled,
  onReview
}: {
  job: Job;
  disabled: boolean;
  onReview: (jobId: number | undefined, profileId: number, decision: "accept" | "reject") => void;
}) {
  const pendingIds = job.idProfiePending ?? [];
  const profiles = useApi(() => (pendingIds.length ? profileApi.pendingJobProfiles(pendingIds) : Promise.resolve([])), [pendingIds.join(",")]);

  if (!pendingIds.length) {
    return null;
  }

  return (
    <div className="mt-4 rounded-md border border-line bg-canvas p-4">
      <h3 className="text-sm font-semibold text-ink">Pending applicants</h3>
      {profiles.loading ? <LoadingState label="Loading applicants" /> : null}
      {profiles.error ? <ErrorState message={profiles.error} /> : null}
      <div className="mt-3 grid gap-3">
        {(profiles.data ?? pendingIds.map((id) => ({ id }) as Profile)).map((profile) => (
          <div key={profile.id} className="flex items-center justify-between gap-3 rounded-md bg-white px-3 py-2 text-sm">
            <div>
              <p className="font-medium text-ink">{profile.name || profile.title || `Profile #${profile.id}`}</p>
              <p className="text-muted">{profile.title || "Applicant"}</p>
            </div>
            <div className="flex gap-2">
              <Button type="button" variant="secondary" onClick={() => onReview(job.id, Number(profile.id), "reject")} disabled={disabled}>
                Reject
              </Button>
              <Button type="button" onClick={() => onReview(job.id, Number(profile.id), "accept")} disabled={disabled}>
                Accept
              </Button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
