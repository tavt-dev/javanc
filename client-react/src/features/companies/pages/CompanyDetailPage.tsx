import { ArrowLeft, Briefcase, Building2, Mail, MapPin, Phone } from "lucide-react";
import type { ElementType } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { PageTransition } from "@/components/motion/PageTransition";
import { EmptyState } from "@/components/shared/EmptyState";
import { LoadingSkeleton } from "@/components/shared/LoadingSkeleton";
import { PageHeader } from "@/components/shared/PageHeader";
import { RetryState } from "@/components/shared/RetryState";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { useCompanyDetailQuery } from "@/features/companies/hooks/use-company-queries";
import { getCompanyLocation } from "@/features/companies/utils/company-utils";
import { JobCard } from "@/features/jobs/components/JobCard";
import { useJobsByCompanyQuery } from "@/features/jobs/hooks/use-job-queries";
import { useMyProfileQuery } from "@/features/profiles/hooks/use-profile-queries";

export function CompanyDetailPage() {
  const params = useParams();
  const navigate = useNavigate();
  const id = params.id ? Number(params.id) : null;
  const companyId = id && Number.isFinite(id) && id > 0 ? id : null;
  const companyQuery = useCompanyDetailQuery(companyId);
  const company = companyQuery.data;
  const jobsQuery = useJobsByCompanyQuery(company?.id);
  const profileQuery = useMyProfileQuery();

  if (!companyId) {
    return (
      <PageTransition>
        <EmptyState
          icon={Building2}
          title="Invalid company"
          description="The company link is not valid."
          action={
            <Link
              to="/companies"
              className="btn-primary focus-ring"
            >
              Back to companies
            </Link>
          }
        />
      </PageTransition>
    );
  }

  if (companyQuery.isLoading) {
    return (
      <PageTransition>
        <PageHeader title="Company detail" description="Loading company." />
        <LoadingSkeleton variant="detail" />
      </PageTransition>
    );
  }

  if (companyQuery.error || !company) {
    return (
      <PageTransition>
        <PageHeader title="Company detail" description="View company details." />
        <RetryState error={companyQuery.error} onRetry={companyQuery.refetch} />
      </PageTransition>
    );
  }

  const jobs = jobsQuery.data ?? [];

  return (
    <PageTransition>
      <PageHeader
        variant="console"
        eyebrow="Company profile"
        title={company.name}
        description={company.description || "Company profile and jobs."}
        actions={
          <>
            <button
              type="button"
              onClick={() => navigate("/companies")}
              className="btn-secondary focus-ring bg-white text-emerald-800 hover:bg-emerald-50"
            >
              <ArrowLeft size={16} />
              Back
            </button>
            <Link
              to="/jobs"
              className="btn-primary focus-ring bg-white text-emerald-800 hover:bg-emerald-50"
            >
              <Briefcase size={16} />
              Browse jobs
            </Link>
          </>
        }
      />

      <section className="surface p-5">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start">
          <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
            {company.url ? (
              <img
                src={company.url}
                alt={`${company.name} logo`}
                className="h-full w-full rounded-lg object-cover"
              />
            ) : (
              <Building2 size={28} />
            )}
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap gap-2">
              {company.type && <StatusBadge tone="primary">{company.type}</StatusBadge>}
              <StatusBadge tone="neutral">
                {`${company.idJobs?.length ?? jobs.length} jobs`}
              </StatusBadge>
            </div>
            <div className="mt-4 grid gap-3 text-sm text-muted-foreground sm:grid-cols-2">
              <Meta icon={MapPin} value={getCompanyLocation(company)} />
              {company.email && <Meta icon={Mail} value={company.email} />}
              {company.phone && <Meta icon={Phone} value={company.phone} />}
              {company.street && <Meta icon={MapPin} value={company.street} />}
            </div>
          </div>
        </div>
      </section>

      <section className="surface p-5">
        <h2 className="text-lg font-semibold">Company jobs</h2>
        {jobsQuery.isLoading ? (
          <div className="mt-4">
            <LoadingSkeleton variant="cardGrid" />
          </div>
        ) : jobsQuery.error ? (
          <div className="mt-4">
            <RetryState error={jobsQuery.error} onRetry={jobsQuery.refetch} />
          </div>
        ) : jobs.length === 0 ? (
          <div className="mt-4">
            <EmptyState
              icon={Briefcase}
              title="No jobs yet"
              description="This company does not have active jobs in the current list."
            />
          </div>
        ) : (
          <div className="mt-4 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {jobs.map((job) => (
              <JobCard
                key={job.id}
                job={job}
                profileId={profileQuery.profile?.id}
                companyName={company.name}
              />
            ))}
          </div>
        )}
      </section>
    </PageTransition>
  );
}

function Meta({
  icon: Icon,
  value,
}: {
  icon: ElementType;
  value: string;
}) {
  return (
    <div className="flex min-w-0 items-center gap-2">
      <Icon size={15} className="shrink-0" />
      <span className="truncate">{value}</span>
    </div>
  );
}
