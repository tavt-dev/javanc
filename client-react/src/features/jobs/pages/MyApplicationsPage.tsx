import { ClipboardList, User } from "lucide-react";
import { useState } from "react";
import { Link } from "react-router-dom";
import { PageTransition } from "@/components/motion/PageTransition";
import { EmptyState } from "@/components/shared/EmptyState";
import { LoadingSkeleton } from "@/components/shared/LoadingSkeleton";
import { PageHeader } from "@/components/shared/PageHeader";
import { RetryState } from "@/components/shared/RetryState";
import { JobCard } from "@/features/jobs/components/JobCard";
import {
  useAcceptedJobsQuery,
  usePendingJobsQuery,
} from "@/features/jobs/hooks/use-job-queries";
import {
  isProfileMissingError,
  useMyProfileQuery,
} from "@/features/profiles/hooks/use-profile-queries";

type ApplicationTab = "pending" | "accepted";

export function MyApplicationsPage() {
  const [tab, setTab] = useState<ApplicationTab>("pending");
  const profileQuery = useMyProfileQuery();
  const profile = profileQuery.profile;
  const pendingQuery = usePendingJobsQuery(profile?.id);
  const acceptedQuery = useAcceptedJobsQuery(profile?.id);
  const activeQuery = tab === "pending" ? pendingQuery : acceptedQuery;
  const jobs = activeQuery.data ?? [];

  if (profileQuery.isLoading) {
    return (
      <PageTransition>
        <PageHeader title="My Applications" description="Loading profile." />
        <LoadingSkeleton variant="detail" />
      </PageTransition>
    );
  }

  if (profileQuery.error && !isProfileMissingError(profileQuery.error)) {
    return (
      <PageTransition>
        <PageHeader title="My Applications" description="Track applications." />
        <RetryState error={profileQuery.error} onRetry={profileQuery.refetch} />
      </PageTransition>
    );
  }

  if (!profile) {
    return (
      <PageTransition>
        <PageHeader
          title="My Applications"
          description="Applications are attached to your profile."
        />
        <EmptyState
          icon={User}
          title="Create your profile first"
          description="A profile is required before applying to jobs."
          action={
            <Link
              to="/profile"
              className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground"
            >
              Go to profile
            </Link>
          }
        />
      </PageTransition>
    );
  }

  return (
    <PageTransition>
      <PageHeader
        title="My Applications"
        description="Track jobs where your profile is pending or accepted."
      />
      <div className="flex flex-wrap gap-2 rounded-lg border border-border bg-card p-2 shadow-sm">
        {(["pending", "accepted"] as const).map((item) => (
          <button
            key={item}
            type="button"
            onClick={() => setTab(item)}
            className={
              tab === item
                ? "rounded-md bg-primary px-4 py-2 text-sm font-medium capitalize text-primary-foreground"
                : "rounded-md px-4 py-2 text-sm font-medium capitalize text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
            }
          >
            {item}
          </button>
        ))}
      </div>

      {activeQuery.isLoading ? (
        <LoadingSkeleton variant="cardGrid" />
      ) : activeQuery.error ? (
        <RetryState error={activeQuery.error} onRetry={activeQuery.refetch} />
      ) : jobs.length === 0 ? (
        <EmptyState
          icon={ClipboardList}
          title={`No ${tab} applications`}
          description="Application updates will appear here after you apply to jobs."
        />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {jobs.map((job) => (
            <JobCard key={job.id} job={job} profileId={profile.id} />
          ))}
        </div>
      )}
    </PageTransition>
  );
}
