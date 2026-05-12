import { ArrowRight, Briefcase, CheckCircle, Clock, Lock } from "lucide-react";
import { Link } from "react-router-dom";
import { motion, useReducedMotion } from "framer-motion";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { getJobApplicationState } from "@/features/jobs/utils/job-utils";
import type { JobDTO } from "@/types/job";

export function JobCard({
  job,
  profileId,
  companyName,
}: {
  job: JobDTO;
  profileId?: number | null;
  companyName?: string;
}) {
  const reduceMotion = useReducedMotion();
  const state = getJobApplicationState(job, profileId);

  return (
    <motion.article
      whileHover={reduceMotion ? undefined : { y: -1 }}
      transition={{ duration: 0.16 }}
      className="rounded-lg border border-border bg-card p-4 shadow-sm transition-shadow hover:shadow-md"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h2 className="truncate text-base font-semibold text-foreground">
            {job.title}
          </h2>
          <p className="mt-1 text-xs text-muted-foreground">
            {companyName || `Company #${job.idCompany}`}
          </p>
        </div>
        {job.typeJob && <StatusBadge tone="primary">{job.typeJob}</StatusBadge>}
      </div>

      <p className="mt-4 line-clamp-3 min-h-12 text-sm text-muted-foreground">
        {job.description || "No description provided."}
      </p>

      <div className="mt-4 flex flex-wrap gap-2 text-xs">
        <span className="inline-flex items-center gap-1 rounded-md bg-muted px-2 py-1 text-muted-foreground">
          <Briefcase size={13} />
          {job.size ?? 0} openings
        </span>
        <JobStateBadge state={state} />
      </div>

      <Link
        to={`/jobs/${job.id}`}
        className="mt-5 inline-flex items-center gap-2 text-sm font-medium text-primary hover:underline"
      >
        View detail
        <ArrowRight size={15} />
      </Link>
    </motion.article>
  );
}

function JobStateBadge({ state }: { state: string }) {
  if (state === "accepted") {
    return (
      <span className="inline-flex items-center gap-1 rounded-md bg-success/10 px-2 py-1 text-success">
        <CheckCircle size={13} />
        Accepted
      </span>
    );
  }
  if (state === "pending") {
    return (
      <span className="inline-flex items-center gap-1 rounded-md bg-warning/10 px-2 py-1 text-warning">
        <Clock size={13} />
        Pending
      </span>
    );
  }
  if (state === "closed") {
    return (
      <span className="inline-flex items-center gap-1 rounded-md bg-muted px-2 py-1 text-muted-foreground">
        <Lock size={13} />
        Closed
      </span>
    );
  }
  return <StatusBadge tone="success">Open</StatusBadge>;
}
