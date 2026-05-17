import { Building2, SlidersHorizontal } from "lucide-react";
import { useMemo } from "react";
import { useSearchParams } from "react-router-dom";
import { PageTransition } from "@/components/motion/PageTransition";
import { StaggerItem, StaggerList } from "@/components/motion/StaggerList";
import { EmptyState } from "@/components/shared/EmptyState";
import { LoadingSkeleton } from "@/components/shared/LoadingSkeleton";
import { PageHeader } from "@/components/shared/PageHeader";
import { PaginationControls } from "@/components/shared/PaginationControls";
import { RetryState } from "@/components/shared/RetryState";
import { SearchHeroPanel } from "@/components/shared/SearchHeroPanel";
import { CompanyCard } from "@/features/companies/components/CompanyCard";
import { useCompaniesQuery } from "@/features/companies/hooks/use-company-queries";

export function CompaniesPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const query = searchParams.get("query") ?? "";
  const type = searchParams.get("type") ?? "";
  const location = searchParams.get("location") ?? "";
  const page = Number(searchParams.get("page") ?? 0);
  const size = Number(searchParams.get("size") ?? 20);
  const sort = searchParams.get("sort") ?? "id,desc";

  const companiesQuery = useCompaniesQuery({
    query: query || undefined,
    type: type || undefined,
    location: location || undefined,
    page,
    size,
    sort,
  });
  const companies = useMemo(() => companiesQuery.data?.items ?? [], [companiesQuery.data]);
  const types = useMemo(
    () =>
      Array.from(new Set(companies.map((company) => company.type).filter(Boolean)))
        .sort() as string[],
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

  return (
    <PageTransition>
      <PageHeader
        variant="hero"
        eyebrow="Company directory"
        title="Companies"
        description="Browse companies and their active jobs."
        search={
          <SearchHeroPanel
            value={query}
            onChange={(value) => updateListParams({ query: value || undefined, page: "0" })}
            placeholder="Search companies, industries, or hiring teams"
            filters={
              <>
                <select
                  value={type}
                  onChange={(event) =>
                    updateListParams({
                      type: event.target.value || undefined,
                      page: "0",
                    })
                  }
                  className="form-input md:w-44"
                >
                  <option value="">All types</option>
                  {types.map((item) => (
                    <option key={item} value={item}>
                      {item}
                    </option>
                  ))}
                </select>
                <input
                  value={location}
                  onChange={(event) =>
                    updateListParams({
                      location: event.target.value || undefined,
                      page: "0",
                    })
                  }
                  placeholder="City or country"
                  className="form-input md:w-56"
                />
                <button
                  type="button"
                  onClick={() =>
                    updateListParams({
                      query: undefined,
                      type: undefined,
                      location: undefined,
                      page: "0",
                    })
                  }
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

      {companiesQuery.isLoading ? (
        <LoadingSkeleton variant="search" />
      ) : companiesQuery.error ? (
        <RetryState
          error={companiesQuery.error}
          onRetry={companiesQuery.refetch}
        />
      ) : companies.length === 0 ? (
        <EmptyState
          icon={Building2}
          title="No companies found"
          description="Try clearing filters or checking again later."
        />
      ) : (
        <div className="space-y-4">
          <StaggerList className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {companies.map((company, index) => (
              <StaggerItem key={company.id} index={index}>
                <CompanyCard company={company} />
              </StaggerItem>
            ))}
          </StaggerList>
          {companiesQuery.data && (
            <PaginationControls
              page={companiesQuery.data}
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
