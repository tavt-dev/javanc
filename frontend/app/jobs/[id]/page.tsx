"use client";

import { useState } from "react";
import { useParams } from "next/navigation";
import { PageHeader } from "@/components/page-header";
import { EmptyState, ErrorState, LoadingState } from "@/components/data-state";
import { Button, Field, inputClass, Pill } from "@/components/ui";
import { jobApi } from "@/lib/api";
import { useApi } from "@/lib/use-api";

export default function JobDetailPage() {
  const params = useParams<{ id: string }>();
  const id = Number(params.id);
  const job = useApi(() => jobApi.byId(id), [id]);
  const [profileId, setProfileId] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function apply() {
    setMessage(null);
    setError(null);
    try {
      await jobApi.apply(id, Number(profileId));
      setMessage("Application sent.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to apply");
    }
  }

  if (job.loading) {
    return <LoadingState label="Loading job" />;
  }

  if (job.error) {
    return <ErrorState message={job.error} />;
  }

  if (!job.data) {
    return <EmptyState title="Job not found" description="This opportunity may have been closed or is no longer available." />;
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
      <section>
        <PageHeader eyebrow="Job" title={job.data.title || `Job #${job.data.id}`} description={job.data.description} />
        <div className="rounded-md border border-line bg-white p-5 shadow-soft">
          <Pill tone="green">{job.data.typeJob || "Job"}</Pill>
          <dl className="mt-5 grid gap-4 text-sm sm:grid-cols-3">
            <div>
              <dt className="font-semibold text-ink">Company</dt>
              <dd className="mt-1 text-muted">#{job.data.idCompany ?? "unknown"}</dd>
            </div>
            <div>
              <dt className="font-semibold text-ink">Team size</dt>
              <dd className="mt-1 text-muted">{job.data.size ?? "Not set"}</dd>
            </div>
            <div>
              <dt className="font-semibold text-ink">Accepted profiles</dt>
              <dd className="mt-1 text-muted">{job.data.idProfile?.length ?? 0}</dd>
            </div>
          </dl>
        </div>
      </section>
      <aside className="rounded-md border border-line bg-white p-5 shadow-soft">
        <h2 className="text-lg font-semibold text-ink">Apply</h2>
        <p className="mt-1 text-sm text-muted">Choose the profile you want to submit for this opportunity.</p>
        <div className="mt-4 space-y-4">
          {error ? <ErrorState message={error} /> : null}
          {message ? <div className="rounded-md border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">{message}</div> : null}
          <Field label="Profile ID">
            <input className={inputClass} value={profileId} onChange={(event) => setProfileId(event.target.value)} type="number" />
          </Field>
          <Button type="button" onClick={apply} disabled={!profileId}>
            Apply to job
          </Button>
        </div>
      </aside>
    </div>
  );
}
