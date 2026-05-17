import { Briefcase, SlidersHorizontal } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { PageTransition } from "@/components/motion/PageTransition";
import { StaggerItem, StaggerList } from "@/components/motion/StaggerList";
import { EmptyState } from "@/components/shared/EmptyState";
import { LoadingSkeleton } from "@/components/shared/LoadingSkeleton";
import { PageHeader } from "@/components/shared/PageHeader";
import { PaginationControls } from "@/components/shared/PaginationControls";
import { RetryState } from "@/components/shared/RetryState";
import { SearchHeroPanel } from "@/components/shared/SearchHeroPanel";
import { useCompaniesQuery } from "@/features/companies/hooks/use-company-queries";
import { JobCard } from "@/features/jobs/components/JobCard";
import { useJobBoardQuery } from "@/features/jobs/hooks/use-job-queries";
import { useMyProfileQuery } from "@/features/profiles/hooks/use-profile-queries";
import type { TypeJob } from "@/types/job";

export function JobBoardPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const profileQuery = useMyProfileQuery();
  const profile = profileQuery.profile;
  const [query, setQuery] = useState(() => searchParams.get("q") ?? "");
  const [debouncedQuery, setDebouncedQuery] = useState(
    () => searchParams.get("q") ?? "",
  );
  const type = readJobType(searchParams.get("type"));
  const companyId = searchParams.get("companyId") ?? "";
  const openOnly = searchParams.get("openOnly") === "true";
  const page = Number(searchParams.get("page") ?? 0);
  const size = Number(searchParams.get("size") ?? 20);
  const sort = searchParams.get("sort") ?? "id,desc";

  const jobsQuery = useJobBoardQuery(profile?.id, {
    query: debouncedQuery || undefined,
    type: type || undefined,
    companyId: companyId || undefined,
    openOnly,
    page,
    size,
    sort,
  });
  const companiesQuery = useCompaniesQuery({ size: 100, sort: "name,asc" });
  const jobs = useMemo(() => jobsQuery.data?.items ?? [], [jobsQuery.data]);
  const companies = useMemo(() => companiesQuery.data?.items ?? [], [companiesQuery.data]);

  const companyMap = useMemo(
    () => new Map(companies.map((company) => [company.id, company.name])),
    [companies],
  );

  const updateListParams = (next: Record<string, string | undefined>) => {
    const updated = new URLSearchParams(searchParams);
    Object.entries(next).forEach(([key, value]) => {
      if (!value) updated.delete(key);
      else updated.set(key, value);
    });
    setSearchParams(updated, { replace: true });
  };

  useEffect(() => {
    const timeout = window.setTimeout(() => {
      const trimmedQuery = query.trim();
      setDebouncedQuery(trimmedQuery);
      updateListParams({ q: trimmedQuery || undefined, page: "0" });
    }, 300);
    return () => window.clearTimeout(timeout);
    // updateListParams depends on the current URL and should not restart the debounce after each URL write.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [query]);

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
                  aria-label="Job type"
                  value={type}
                  onChange={(event) =>
                    updateListParams({
                      type: event.target.value || undefined,
                      page: "0",
                    })
                  }
                  className="form-input md:w-40"
                >
                  <option value="">All types</option>
                  <option value="java">Java</option>
                  <option value="python">Python</option>
                  <option value="php">PHP</option>
                </select>
                <select
                  aria-label="Company"
                  value={companyId}
                  onChange={(event) =>
                    updateListParams({
                      companyId: event.target.value || undefined,
                      page: "0",
                    })
                  }
                  className="form-input md:w-56"
                >
                  <option value="">All companies</option>
                  {companies.map((company) => (
                    <option key={company.id} value={company.id}>
                      {company.name}
                    </option>
                  ))}
                </select>
                <label className="brand-chip min-h-10 cursor-pointer bg-white/90 text-emerald-800">
                  <input
                    type="checkbox"
                    checked={openOnly}
                    onChange={(event) =>
                      updateListParams({
                        openOnly: event.target.checked ? "true" : undefined,
                        page: "0",
                      })
                    }
                  />
                  Open only
                </label>
                <button
                  type="button"
                  onClick={() => {
                    setQuery("");
                    setDebouncedQuery("");
                    updateListParams({
                      q: undefined,
                      type: undefined,
                      companyId: undefined,
                      openOnly: undefined,
                      page: "0",
                    });
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
      ) : jobs.length === 0 ? (
        <EmptyState
          icon={Briefcase}
          title="No jobs found"
          description="Try clearing filters or checking again later."
        />
      ) : (
        <div className="space-y-4">
          <StaggerList className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {jobs.map((job, index) => (
              <StaggerItem key={job.id} index={index}>
                <JobCard
                  job={job}
                  profileId={profile?.id}
                  companyName={companyMap.get(job.idCompany)}
                />
              </StaggerItem>
            ))}
          </StaggerList>
          {jobsQuery.data && (
            <PaginationControls
              page={jobsQuery.data}
              onPageChange={(nextPage) => updateListParams({ page: String(nextPage) })}
              onSizeChange={(nextSize) =>
                updateListParams({ size: String(nextSize), page: "0" })
              }
            />
          )}
        </div>
      )}
    </PageTransition>
  );
}

function readJobType(value: string | null): TypeJob | "" {
  return value === "java" || value === "python" || value === "php" ? value : "";
}
