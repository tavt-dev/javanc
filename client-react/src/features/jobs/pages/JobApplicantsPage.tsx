import { ArrowLeft, CheckCircle, XCircle } from "lucide-react";
import { useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { PageTransition } from "@/components/motion/PageTransition";
import { ConfirmDialog } from "@/components/shared/ConfirmDialog";
import { EmptyState } from "@/components/shared/EmptyState";
import { LoadingSkeleton } from "@/components/shared/LoadingSkeleton";
import { PageHeader } from "@/components/shared/PageHeader";
import { RetryState } from "@/components/shared/RetryState";
import { StatusBadge } from "@/components/shared/StatusBadge";
import {
  useAcceptApplicantMutation,
  useJobDetailQuery,
  useRejectApplicantMutation,
} from "@/features/jobs/hooks/use-job-queries";
import { useHrCompanyQuery } from "@/features/companies/hooks/use-company-queries";
import { useApplicantProfilesQuery } from "@/features/profiles/hooks/use-profile-queries";
import { useAuthStore } from "@/stores/auth-store";
import type { ProfileDTO } from "@/types/profile";

type ApplicantAction = { type: "accept" | "reject"; profile: ProfileDTO } | null;

export function JobApplicantsPage() {
  const { id } = useParams();
  const jobId = Number(id);
  const user = useAuthStore((s) => s.user);
  const [tab, setTab] = useState<"pending" | "accepted">("pending");
  const [action, setAction] = useState<ApplicantAction>(null);

  const companyQuery = useHrCompanyQuery(user?.id);
  const jobQuery = useJobDetailQuery(Number.isFinite(jobId) ? jobId : null);
  const job = jobQuery.data ?? null;
  const pendingIds = useMemo(() => job?.idProfiePending ?? [], [job]);
  const acceptedIds = useMemo(() => job?.idProfile ?? [], [job]);
  const applicantIds = tab === "pending" ? pendingIds : acceptedIds;
  const profilesQuery = useApplicantProfilesQuery(applicantIds);
  const acceptMutation = useAcceptApplicantMutation(jobId);
  const rejectMutation = useRejectApplicantMutation(jobId);

  if (companyQuery.isLoading || jobQuery.isLoading) {
    return (
      <PageTransition>
        <PageHeader title="Applicants" description="Loading job applicants." />
        <LoadingSkeleton variant="detail" />
      </PageTransition>
    );
  }

  if (companyQuery.error || jobQuery.error || !job) {
    return (
      <PageTransition>
        <PageHeader title="Applicants" description="Review job applicants." />
        <RetryState
          error={companyQuery.error || jobQuery.error}
          onRetry={() => {
            companyQuery.refetch();
            jobQuery.refetch();
          }}
        />
      </PageTransition>
    );
  }

  if (job.idCompany !== companyQuery.data?.id) {
    return (
      <PageTransition>
        <PageHeader title="Applicants" description="Review job applicants." />
        <EmptyState
          icon={XCircle}
          title="You cannot review this job"
          description="This job does not belong to the company assigned to your HR account."
          action={
            <Link className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground" to="/hr/jobs">
              Back to jobs
            </Link>
          }
        />
      </PageTransition>
    );
  }

  const profiles = profilesQuery.data ?? [];

  return (
    <PageTransition>
      <PageHeader
        title={job.title}
        description="Review pending and accepted applicants."
        actions={
          <Link to="/hr/jobs" className="inline-flex items-center gap-2 rounded-md border border-border px-4 py-2 text-sm font-medium hover:bg-accent">
            <ArrowLeft size={16} />
            Back
          </Link>
        }
      />

      <div className="flex gap-2 rounded-lg border border-border bg-card p-2">
        {(["pending", "accepted"] as const).map((item) => (
          <button
            key={item}
            type="button"
            onClick={() => setTab(item)}
            className={`rounded-md px-4 py-2 text-sm font-medium capitalize transition-colors ${
              tab === item ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-accent"
            }`}
          >
            {item} ({item === "pending" ? pendingIds.length : acceptedIds.length})
          </button>
        ))}
      </div>

      {profilesQuery.isLoading ? (
        <LoadingSkeleton variant="cardGrid" />
      ) : profiles.length ? (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {profiles.map((profile) => (
            <article key={profile.id} className="rounded-lg border border-border bg-card p-4 shadow-sm">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <h2 className="truncate font-semibold">{profile.title || `Profile #${profile.id}`}</h2>
                  <p className="text-xs text-muted-foreground">User #{profile.idUser}</p>
                </div>
                {profile.typeProfile && <StatusBadge tone="primary">{profile.typeProfile}</StatusBadge>}
              </div>
              <p className="mt-3 line-clamp-3 text-sm text-muted-foreground">
                {profile.skills || profile.objective || "No profile summary provided."}
              </p>
              <div className="mt-4 flex flex-wrap gap-2">
                <Link to={`/profiles/${profile.id}`} className="rounded-md border border-border px-3 py-2 text-sm font-medium hover:bg-accent">
                  View profile
                </Link>
                {tab === "pending" && (
                  <>
                    <button type="button" disabled={(job.size ?? 0) <= 0} onClick={() => setAction({ type: "accept", profile })} className="inline-flex items-center gap-1 rounded-md bg-primary px-3 py-2 text-sm font-medium text-primary-foreground disabled:opacity-50">
                      <CheckCircle size={15} />
                      Accept
                    </button>
                    <button type="button" onClick={() => setAction({ type: "reject", profile })} className="inline-flex items-center gap-1 rounded-md border border-destructive/30 px-3 py-2 text-sm font-medium text-destructive hover:bg-destructive/10">
                      <XCircle size={15} />
                      Reject
                    </button>
                  </>
                )}
              </div>
            </article>
          ))}
        </div>
      ) : (
        <EmptyState
          icon={CheckCircle}
          title={`No ${tab} applicants`}
          description="Applicants will appear here after users apply to this job."
        />
      )}

      <ConfirmDialog
        open={Boolean(action)}
        title={action?.type === "accept" ? "Accept applicant" : "Reject applicant"}
        description={`${action?.type === "accept" ? "Accept" : "Reject"} ${action?.profile.title ?? "this applicant"}?`}
        confirmLabel={action?.type === "accept" ? "Accept" : "Reject"}
        destructive={action?.type === "reject"}
        loading={acceptMutation.isPending || rejectMutation.isPending}
        onCancel={() => setAction(null)}
        onConfirm={() => {
          if (!action) return;
          const mutation = action.type === "accept" ? acceptMutation : rejectMutation;
          mutation.mutate(action.profile.id, { onSuccess: () => setAction(null) });
        }}
      />
    </PageTransition>
  );
}
