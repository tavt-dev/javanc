import { Briefcase, Search, SlidersHorizontal } from "lucide-react";
import { useMemo, useState } from "react";
import { PageTransition } from "@/components/motion/PageTransition";
import { StaggerItem, StaggerList } from "@/components/motion/StaggerList";
import { EmptyState } from "@/components/shared/EmptyState";
import { LoadingSkeleton } from "@/components/shared/LoadingSkeleton";
import { PageHeader } from "@/components/shared/PageHeader";
import { RetryState } from "@/components/shared/RetryState";
import { useCompaniesQuery } from "@/features/companies/hooks/use-company-queries";
import { JobCard } from "@/features/jobs/components/JobCard";
import { useJobBoardQuery } from "@/features/jobs/hooks/use-job-queries";
import { filterJobs } from "@/features/jobs/utils/job-utils";
import { useMyProfileQuery } from "@/features/profiles/hooks/use-profile-queries";
import type { TypeJob } from "@/types/job";

export function JobBoardPage() {
  const profileQuery = useMyProfileQuery();
  const profile = profileQuery.profile;
  const jobsQuery = useJobBoardQuery(profile?.id);
  const companiesQuery = useCompaniesQuery();
  const [query, setQuery] = useState("");
  const [type, setType] = useState<TypeJob | "">("");
  const [companyId, setCompanyId] = useState("");
  const [openOnly, setOpenOnly] = useState(false);

  const companyMap = useMemo(
    () => new Map((companiesQuery.data ?? []).map((company) => [company.id, company.name])),
    [companiesQuery.data],
  );
  const filteredJobs = useMemo(
    () =>
      filterJobs(jobsQuery.data ?? [], {
        query,
        type,
        companyId,
        openOnly,
      }),
    [jobsQuery.data, query, type, companyId, openOnly],
  );

  return (
    <PageTransition>
      <PageHeader
        title="Job Board"
        description="Browse active jobs and apply with your profile."
      />

      <div className="rounded-lg border border-border bg-card p-4 shadow-sm">
        <div className="grid gap-3 lg:grid-cols-[1fr_150px_220px_auto_auto]">
          <label className="relative block">
            <Search
              size={16}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
            />
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search jobs"
              className="w-full rounded-md border border-input bg-background py-2 pl-9 pr-3 text-sm outline-none transition-colors focus:border-ring focus:ring-2 focus:ring-ring/20"
            />
          </label>
          <select
            value={type}
            onChange={(event) => setType(event.target.value as TypeJob | "")}
            className="rounded-md border border-input bg-background px-3 py-2 text-sm outline-none transition-colors focus:border-ring focus:ring-2 focus:ring-ring/20"
          >
            <option value="">All types</option>
            <option value="java">Java</option>
            <option value="python">Python</option>
            <option value="php">PHP</option>
          </select>
          <select
            value={companyId}
            onChange={(event) => setCompanyId(event.target.value)}
            className="rounded-md border border-input bg-background px-3 py-2 text-sm outline-none transition-colors focus:border-ring focus:ring-2 focus:ring-ring/20"
          >
            <option value="">All companies</option>
            {(companiesQuery.data ?? []).map((company) => (
              <option key={company.id} value={company.id}>
                {company.name}
              </option>
            ))}
          </select>
          <label className="flex items-center gap-2 rounded-md border border-border px-3 py-2 text-sm">
            <input
              type="checkbox"
              checked={openOnly}
              onChange={(event) => setOpenOnly(event.target.checked)}
            />
            Open only
          </label>
          <button
            type="button"
            onClick={() => {
              setQuery("");
              setType("");
              setCompanyId("");
              setOpenOnly(false);
            }}
            className="inline-flex items-center justify-center gap-2 rounded-md border border-border px-4 py-2 text-sm font-medium transition-colors hover:bg-accent"
          >
            <SlidersHorizontal size={16} />
            Clear
          </button>
        </div>
      </div>

      {jobsQuery.isLoading ? (
        <LoadingSkeleton variant="cardGrid" />
      ) : jobsQuery.error ? (
        <RetryState error={jobsQuery.error} onRetry={jobsQuery.refetch} />
      ) : filteredJobs.length === 0 ? (
        <EmptyState
          icon={Briefcase}
          title="No jobs found"
          description="Try clearing filters or checking again later."
        />
      ) : (
        <StaggerList className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {filteredJobs.map((job) => (
            <StaggerItem key={job.id}>
              <JobCard
                job={job}
                profileId={profile?.id}
                companyName={companyMap.get(job.idCompany)}
              />
            </StaggerItem>
          ))}
        </StaggerList>
      )}
    </PageTransition>
  );
}
