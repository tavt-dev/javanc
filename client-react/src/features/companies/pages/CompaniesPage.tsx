import { Building2, SlidersHorizontal } from "lucide-react";
import { useMemo, useState } from "react";
import { PageTransition } from "@/components/motion/PageTransition";
import { StaggerItem, StaggerList } from "@/components/motion/StaggerList";
import { EmptyState } from "@/components/shared/EmptyState";
import { LoadingSkeleton } from "@/components/shared/LoadingSkeleton";
import { PageHeader } from "@/components/shared/PageHeader";
import { RetryState } from "@/components/shared/RetryState";
import { SearchHeroPanel } from "@/components/shared/SearchHeroPanel";
import { CompanyCard } from "@/features/companies/components/CompanyCard";
import { useCompaniesQuery } from "@/features/companies/hooks/use-company-queries";
import { filterCompanies } from "@/features/companies/utils/company-utils";

export function CompaniesPage() {
  const companiesQuery = useCompaniesQuery();
  const [query, setQuery] = useState("");
  const [type, setType] = useState("");
  const [location, setLocation] = useState("");
  const companies = useMemo(() => companiesQuery.data ?? [], [companiesQuery.data]);
  const types = useMemo(
    () =>
      Array.from(new Set(companies.map((company) => company.type).filter(Boolean)))
        .sort() as string[],
    [companies],
  );
  const filtered = useMemo(
    () => filterCompanies(companies, { query, type, location }),
    [companies, query, type, location],
  );

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
            onChange={setQuery}
            placeholder="Search companies, industries, or hiring teams"
            filters={
              <>
                <select
                  value={type}
                  onChange={(event) => setType(event.target.value)}
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
                  onChange={(event) => setLocation(event.target.value)}
                  placeholder="City or country"
                  className="form-input md:w-56"
                />
                <button
                  type="button"
                  onClick={() => {
                    setQuery("");
                    setType("");
                    setLocation("");
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

      {companiesQuery.isLoading ? (
        <LoadingSkeleton variant="search" />
      ) : companiesQuery.error ? (
        <RetryState
          error={companiesQuery.error}
          onRetry={companiesQuery.refetch}
        />
      ) : filtered.length === 0 ? (
        <EmptyState
          icon={Building2}
          title="No companies found"
          description="Try clearing filters or checking again later."
        />
      ) : (
        <StaggerList className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {filtered.map((company, index) => (
            <StaggerItem key={company.id} index={index}>
              <CompanyCard company={company} />
            </StaggerItem>
          ))}
        </StaggerList>
      )}
    </PageTransition>
  );
}
