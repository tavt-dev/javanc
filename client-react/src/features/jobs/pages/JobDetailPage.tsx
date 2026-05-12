import { ArrowLeft, Briefcase, CheckCircle, Send, User } from "lucide-react";
import type { ElementType, ReactNode } from "react";
import { useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { PageTransition } from "@/components/motion/PageTransition";
import { ConfirmDialog } from "@/components/shared/ConfirmDialog";
import { EmptyState } from "@/components/shared/EmptyState";
import { LoadingSkeleton } from "@/components/shared/LoadingSkeleton";
import { PageHeader } from "@/components/shared/PageHeader";
import { RetryState } from "@/components/shared/RetryState";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { useCompanyDetailQuery } from "@/features/companies/hooks/use-company-queries";
import {
  useApplyJobMutation,
  useJobDetailQuery,
} from "@/features/jobs/hooks/use-job-queries";
import { getJobApplicationState } from "@/features/jobs/utils/job-utils";
import { useMyProfileQuery } from "@/features/profiles/hooks/use-profile-queries";
import { useAuthStore } from "@/stores/auth-store";

export function JobDetailPage() {
  const params = useParams();
  const navigate = useNavigate();
  const user = useAuthStore((s) => s.user);
  const jobId = params.id ? Number(params.id) : null;
  const validJobId = jobId && Number.isFinite(jobId) && jobId > 0 ? jobId : null;
  const jobQuery = useJobDetailQuery(validJobId);
  const profileQuery = useMyProfileQuery();
  const profile = profileQuery.profile;
  const job = jobQuery.data;
  const companyQuery = useCompanyDetailQuery(job?.idCompany ?? null);
  const applyMutation = useApplyJobMutation(profile?.id ?? 0);
  const [confirmApply, setConfirmApply] = useState(false);
  const state = job ? getJobApplicationState(job, profile?.id) : "open";

  if (!validJobId) {
    return (
      <PageTransition>
        <EmptyState
          icon={Briefcase}
          title="Invalid job"
          description="The job link is not valid."
          action={
            <Link
              to="/jobs"
              className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground"
            >
              Back to jobs
            </Link>
          }
        />
      </PageTransition>
    );
  }

  if (jobQuery.isLoading) {
    return (
      <PageTransition>
        <PageHeader title="Job detail" description="Loading job." />
        <LoadingSkeleton variant="detail" />
      </PageTransition>
    );
  }

  if (jobQuery.error || !job) {
    return (
      <PageTransition>
        <PageHeader title="Job detail" description="View job details." />
        <RetryState error={jobQuery.error} onRetry={jobQuery.refetch} />
      </PageTransition>
    );
  }

  return (
    <PageTransition>
      <PageHeader
        title={job.title}
        description={companyQuery.data?.name || `Company #${job.idCompany}`}
        actions={
          <button
            type="button"
            onClick={() => navigate("/jobs")}
            className="inline-flex items-center gap-2 rounded-md border border-border px-4 py-2 text-sm font-medium transition-colors hover:bg-accent"
          >
            <ArrowLeft size={16} />
            Back
          </button>
        }
      />

      <div className="grid gap-6 xl:grid-cols-[1fr_360px]">
        <section className="space-y-4">
          <div className="rounded-lg border border-border bg-card p-5 shadow-sm">
            <div className="flex flex-wrap gap-2">
              {job.typeJob && <StatusBadge tone="primary">{job.typeJob}</StatusBadge>}
              <StatusBadge tone={(job.size ?? 0) > 0 ? "success" : "neutral"}>
                {`${job.size ?? 0} openings`}
              </StatusBadge>
            </div>
            <h2 className="mt-5 text-lg font-semibold">Description</h2>
            <p className="mt-3 whitespace-pre-wrap text-sm leading-6 text-muted-foreground">
              {job.description || "No description provided."}
            </p>
          </div>

          <div className="rounded-lg border border-border bg-card p-5 shadow-sm">
            <h2 className="text-lg font-semibold">Company</h2>
            {companyQuery.isLoading ? (
              <p className="mt-3 text-sm text-muted-foreground">Loading company...</p>
            ) : companyQuery.data ? (
              <div className="mt-3 space-y-2 text-sm text-muted-foreground">
                <p className="font-medium text-foreground">{companyQuery.data.name}</p>
                <p>{companyQuery.data.description || "No company description."}</p>
                <Link
                  to={`/companies/${companyQuery.data.id}`}
                  className="inline-flex text-primary hover:underline"
                >
                  View company
                </Link>
              </div>
            ) : (
              <p className="mt-3 text-sm text-muted-foreground">
                Company information is unavailable.
              </p>
            )}
          </div>
        </section>

        <aside className="rounded-lg border border-border bg-card p-5 shadow-sm">
          <h2 className="text-lg font-semibold">Application</h2>
          {user?.role !== "user" ? (
            <StatusPanel
              icon={User}
              title="Browse only"
              description="Only user accounts can apply to jobs."
            />
          ) : !profile ? (
            <StatusPanel
              icon={User}
              title="Create a profile first"
              description="Your profile is required before applying."
              action={
                <Link
                  to="/profile"
                  className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground"
                >
                  Create profile
                </Link>
              }
            />
          ) : state === "accepted" ? (
            <StatusPanel
              icon={CheckCircle}
              title="Accepted"
              description="Your profile has been accepted for this job."
            />
          ) : state === "pending" ? (
            <StatusPanel
              icon={Send}
              title="Pending"
              description="Your application is waiting for HR review."
            />
          ) : state === "closed" ? (
            <StatusPanel
              icon={Briefcase}
              title="Closed"
              description="This job has no available openings."
            />
          ) : (
            <StatusPanel
              icon={Send}
              title="Ready to apply"
              description="Submit your current profile for this job."
              action={
                <button
                  type="button"
                  onClick={() => setConfirmApply(true)}
                  className="inline-flex items-center gap-2 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
                >
                  <Send size={16} />
                  Apply
                </button>
              }
            />
          )}
        </aside>
      </div>

      <ConfirmDialog
        open={confirmApply}
        title="Apply to this job?"
        description="Your current profile will be submitted for HR review."
        confirmLabel="Apply"
        loading={applyMutation.isPending}
        onCancel={() => setConfirmApply(false)}
        onConfirm={() =>
          applyMutation.mutate(job.id, {
            onSuccess: () => setConfirmApply(false),
          })
        }
      />
    </PageTransition>
  );
}

function StatusPanel({
  icon: Icon,
  title,
  description,
  action,
}: {
  icon: ElementType;
  title: string;
  description: string;
  action?: ReactNode;
}) {
  return (
    <div className="mt-4 rounded-lg border border-border p-4">
      <Icon size={22} className="text-primary" />
      <h3 className="mt-3 font-semibold">{title}</h3>
      <p className="mt-2 text-sm text-muted-foreground">{description}</p>
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}
