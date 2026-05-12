import { Building2, Search, SlidersHorizontal } from "lucide-react";
import { useMemo, useState } from "react";
import { PageTransition } from "@/components/motion/PageTransition";
import { StaggerItem, StaggerList } from "@/components/motion/StaggerList";
import { EmptyState } from "@/components/shared/EmptyState";
import { LoadingSkeleton } from "@/components/shared/LoadingSkeleton";
import { PageHeader } from "@/components/shared/PageHeader";
import { RetryState } from "@/components/shared/RetryState";
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
        title="Companies"
        description="Browse companies and their active jobs."
      />

      <div className="rounded-lg border border-border bg-card p-4 shadow-sm">
        <div className="grid gap-3 lg:grid-cols-[1fr_180px_220px_auto]">
          <label className="relative block">
            <Search
              size={16}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
            />
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search companies"
              className="w-full rounded-md border border-input bg-background py-2 pl-9 pr-3 text-sm outline-none transition-colors focus:border-ring focus:ring-2 focus:ring-ring/20"
            />
          </label>
          <select
            value={type}
            onChange={(event) => setType(event.target.value)}
            className="rounded-md border border-input bg-background px-3 py-2 text-sm outline-none transition-colors focus:border-ring focus:ring-2 focus:ring-ring/20"
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
            className="rounded-md border border-input bg-background px-3 py-2 text-sm outline-none transition-colors focus:border-ring focus:ring-2 focus:ring-ring/20"
          />
          <button
            type="button"
            onClick={() => {
              setQuery("");
              setType("");
              setLocation("");
            }}
            className="inline-flex items-center justify-center gap-2 rounded-md border border-border px-4 py-2 text-sm font-medium transition-colors hover:bg-accent"
          >
            <SlidersHorizontal size={16} />
            Clear
          </button>
        </div>
      </div>

      {companiesQuery.isLoading ? (
        <LoadingSkeleton variant="cardGrid" />
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
          {filtered.map((company) => (
            <StaggerItem key={company.id}>
              <CompanyCard company={company} />
            </StaggerItem>
          ))}
        </StaggerList>
      )}
    </PageTransition>
  );
}
