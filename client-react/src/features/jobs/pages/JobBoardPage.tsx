import { Briefcase, SlidersHorizontal } from "lucide-react";
import { useMemo, useState } from "react";
import { PageTransition } from "@/components/motion/PageTransition";
import { StaggerItem, StaggerList } from "@/components/motion/StaggerList";
import { EmptyState } from "@/components/shared/EmptyState";
import { LoadingSkeleton } from "@/components/shared/LoadingSkeleton";
import { PageHeader } from "@/components/shared/PageHeader";
import { RetryState } from "@/components/shared/RetryState";
import { SearchHeroPanel } from "@/components/shared/SearchHeroPanel";
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
        variant="hero"
        eyebrow="Job marketplace"
        title="Job Board"
        description="Browse active jobs and apply with your profile."
        search={
          <SearchHeroPanel
            value={query}
            onChange={setQuery}
            placeholder="Search jobs, descriptions, or hiring signals"
            filters={
              <>
                <select
                  value={type}
                  onChange={(event) => setType(event.target.value as TypeJob | "")}
                  className="form-input md:w-40"
                >
                  <option value="">All types</option>
                  <option value="java">Java</option>
                  <option value="python">Python</option>
                  <option value="php">PHP</option>
                </select>
                <select
                  value={companyId}
                  onChange={(event) => setCompanyId(event.target.value)}
                  className="form-input md:w-56"
                >
                  <option value="">All companies</option>
                  {(companiesQuery.data ?? []).map((company) => (
                    <option key={company.id} value={company.id}>
                      {company.name}
                    </option>
                  ))}
                </select>
                <label className="brand-chip min-h-10 cursor-pointer bg-white/90 text-emerald-800">
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
                  className="btn-secondary focus-ring h-10 bg-card"
                >
                  <SlidersHorizontal size={16} />
                  Clear
                </button>
              </>
            }
          />
        }
      />

      {jobsQuery.isLoading ? (
        <LoadingSkeleton variant="search" />
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
          {filteredJobs.map((job, index) => (
            <StaggerItem key={job.id} index={index}>
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
