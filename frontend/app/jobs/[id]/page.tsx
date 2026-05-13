"use client";

import { useState } from "react";
import { useParams } from "next/navigation";
import { PageHeader } from "@/components/page-header";
import { EmptyState, ErrorState, LoadingState } from "@/components/data-state";
import { Protected } from "@/components/protected";
import { Button, Pill } from "@/components/ui";
import { companyApi, jobApi, profileApi } from "@/lib/api";
import { useApi } from "@/lib/use-api";
import { useAuth } from "@/features/auth/auth-provider";

export default function JobDetailPage() {
  const params = useParams<{ id: string }>();
  const id = Number(params.id);
  const { signedIn, user } = useAuth();
  const role = user?.role?.toLowerCase();
  const canApply = role === "user";
  const [statusVersion, setStatusVersion] = useState(0);
  const job = useApi(() => (signedIn ? jobApi.byId(id) : Promise.resolve(null)), [id, signedIn]);
  const company = useApi(
    () => (job.data?.idCompany ? companyApi.byId(job.data.idCompany).catch(() => null) : Promise.resolve(null)),
    [job.data?.idCompany]
  );
  const profile = useApi(() => (signedIn && canApply ? profileApi.me().catch(() => null) : Promise.resolve(null)), [signedIn, canApply]);
  const status = useApi(() => (signedIn && canApply ? jobApi.applicationStatus(id).catch(() => "NONE") : Promise.resolve("NONE")), [id, signedIn, canApply, statusVersion]);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [working, setWorking] = useState(false);

  async function apply() {
    if (!profile.data?.id) {
      setError("Create a profile before applying.");
      return;
    }
    setMessage(null);
    setError(null);
    setWorking(true);
    try {
      await jobApi.applyMine(id);
      setMessage("Application sent.");
      setStatusVersion((current) => current + 1);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to apply");
    } finally {
      setWorking(false);
    }
  }

  async function leaveJob() {
    setMessage(null);
    setError(null);
    setWorking(true);
    try {
      await jobApi.leaveMine(id);
      setMessage("You left this job application.");
      setStatusVersion((current) => current + 1);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to leave job");
    } finally {
      setWorking(false);
    }
  }

  if (!signedIn) {
    return (
      <Protected>
        <LoadingState label="Checking session" />
      </Protected>
    );
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
    <Protected>
    <div className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
      <section>
        <PageHeader
          eyebrow="Job"
          title={job.data.title || `Job #${job.data.id}`}
          description={job.data.description}
          breadcrumbs={[{ label: "Jobs", href: "/jobs" }, { label: job.data.title || `Job #${job.data.id}` }]}
        />
        <div className="rounded-md border border-line bg-white p-5 shadow-soft">
          <Pill tone="green">{job.data.typeJob || "Job"}</Pill>
          <dl className="mt-5 grid gap-4 text-sm sm:grid-cols-3">
            <div>
              <dt className="font-semibold text-ink">Company</dt>
              <dd className="mt-1 text-muted">
                {company.loading ? "Loading..." : company.data?.name || (job.data.idCompany ? `Company #${job.data.idCompany}` : "Unknown")}
              </dd>
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
        <h2 className="text-lg font-semibold text-ink">Application</h2>
        <p className="mt-1 text-sm text-muted">Submit or manage your current profile for this opportunity.</p>
        <div className="mt-4 space-y-4">
          {error ? <ErrorState message={error} /> : null}
          {message ? <div className="rounded-md border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">{message}</div> : null}
          {!canApply ? <EmptyState title="User account required" description="Only normal user accounts can apply for jobs." /> : null}
          {canApply && profile.loading ? <LoadingState label="Checking profile" /> : null}
          {canApply && !profile.loading && !profile.data ? <EmptyState title="No profile found" description="Create a profile first, then apply again." /> : null}
          {canApply && profile.data ? <p className="text-sm text-muted">Applying as {profile.data.name || profile.data.title || `Profile #${profile.data.id}`}.</p> : null}
          {canApply && status.data && status.data !== "NONE" ? (
            <Pill tone={status.data === "ACCEPTED" ? "green" : "blue"}>{status.data}</Pill>
          ) : null}
          {canApply && status.data === "NONE" ? (
            <Button type="button" onClick={apply} disabled={!profile.data?.id || working}>
              Apply to job
            </Button>
          ) : null}
          {canApply && (status.data === "PENDING" || status.data === "ACCEPTED") ? (
            <Button type="button" variant="secondary" onClick={leaveJob} disabled={working}>
              Leave job
            </Button>
          ) : null}
        </div>
      </aside>
    </div>
    </Protected>
  );
}
