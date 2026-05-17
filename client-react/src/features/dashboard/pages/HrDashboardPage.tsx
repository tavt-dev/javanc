import { Briefcase, Building2, ClipboardList, FileEdit, Users } from "lucide-react";
import type { ElementType } from "react";
import { Link } from "react-router-dom";
import { PageTransition } from "@/components/motion/PageTransition";
import { BrandPanel } from "@/components/shared/BrandPanel";
import { EmptyState } from "@/components/shared/EmptyState";
import { LoadingSkeleton } from "@/components/shared/LoadingSkeleton";
import { MetricTile } from "@/components/shared/MetricTile";
import { PageHeader } from "@/components/shared/PageHeader";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { useHrCompanyQuery } from "@/features/companies/hooks/use-company-queries";
import { useJobsByCompanyQuery } from "@/features/jobs/hooks/use-job-queries";
import { useAuthStore } from "@/stores/auth-store";

export function HrDashboardPage() {
  const user = useAuthStore((s) => s.user);
  const companyQuery = useHrCompanyQuery(user?.id);
  const company = companyQuery.data ?? null;
  const jobsQuery = useJobsByCompanyQuery(company?.id);
  const jobs = jobsQuery.data?.items ?? [];
  const pendingApplicants = jobs.reduce((total, job) => total + (job.idProfiePending?.length ?? 0), 0);
  const acceptedApplicants = jobs.reduce((total, job) => total + (job.idProfile?.length ?? 0), 0);

  if (companyQuery.isLoading) {
    return (
      <PageTransition>
        <PageHeader title="HR Dashboard" description="Loading hiring workspace." />
        <LoadingSkeleton />
      </PageTransition>
    );
  }

  if (companyQuery.error || !company) {
    return (
      <PageTransition>
        <PageHeader title="HR Dashboard" description="Hiring workspace." />
        <EmptyState
          icon={Building2}
          title="HR account has not been assigned to a company"
          description="Ask a manager to assign your HR account before managing jobs and applicants."
        />
      </PageTransition>
    );
  }

  return (
    <PageTransition>
      <BrandPanel variant="hero" className="dashboard-hero dashboard-hero-hr p-5 sm:p-6 lg:p-7">
        <div className="flex flex-col gap-6 xl:flex-row xl:items-end xl:justify-between">
          <div className="min-w-0">
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-white/75">
              Hiring workspace
            </p>
            <h1 className="mt-2 max-w-3xl break-words text-2xl font-semibold tracking-tight text-white sm:text-3xl">
              HR Dashboard
            </h1>
            <p className="mt-2 max-w-3xl text-sm leading-6 text-white/78">
              Manage job postings, review applicant pipelines, and keep hiring activity moving for {company.name}.
            </p>
            <div className="mt-4 flex flex-wrap gap-2">
              <StatusBadge tone="primary">hr</StatusBadge>
              <span className="brand-chip border-white/20 bg-white/10 text-white">{company.name}</span>
            </div>
          </div>
          <Link to="/hr/jobs" className="btn-primary focus-ring bg-white text-cyan-950 hover:bg-white/90">
            <FileEdit size={16} />
            Manage jobs
          </Link>
        </div>

        <div className="mt-6 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          <MetricTile variant="dark" icon={Briefcase} label="Jobs" value={jobs.length} detail={jobsQuery.isFetching ? "Refreshing" : "Company openings"} />
          <MetricTile variant="dark" icon={ClipboardList} label="Pending applicants" value={pendingApplicants} detail="Waiting for review" />
          <MetricTile variant="dark" icon={Users} label="Accepted applicants" value={acceptedApplicants} detail="Approved profiles" />
          <MetricTile variant="dark" icon={Building2} label="Company" value={company.id} detail={company.name} />
        </div>
      </BrandPanel>

      <div className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
        <section className="surface p-5">
          <div className="flex items-start justify-between gap-3">
            <div>
              <h2 className="text-lg font-semibold">Applicant pipeline</h2>
              <p className="mt-1 text-sm text-muted-foreground">
                Jobs with pending applicants should be reviewed first.
              </p>
            </div>
            <StatusBadge tone={pendingApplicants ? "warning" : "success"}>
              {pendingApplicants ? "Needs review" : "Clear"}
            </StatusBadge>
          </div>

          <div className="mt-4 space-y-3">
            {jobs.length ? (
              jobs.slice(0, 5).map((job) => (
                <Link key={job.id} to={`/hr/jobs/${job.id}/applicants`} className="focus-ring flex items-center justify-between gap-3 rounded-md border border-border bg-background px-3 py-3 text-sm transition-colors hover:bg-accent">
                  <div className="min-w-0">
                    <p className="truncate font-medium">{job.title}</p>
                    <p className="mt-1 text-xs text-muted-foreground">{job.typeJob || "General"} role</p>
                  </div>
                  <span className="shrink-0 text-xs font-semibold text-warning">
                    {job.idProfiePending?.length ?? 0} pending
                  </span>
                </Link>
              ))
            ) : (
              <EmptyState icon={Briefcase} title="No jobs yet" description="Create the first job for this company." />
            )}
          </div>
        </section>

        <section className="surface p-5">
          <h2 className="text-lg font-semibold">Quick actions</h2>
          <div className="mt-4 grid gap-3">
            <QuickAction to="/hr/jobs" icon={FileEdit} label="Manage Jobs" />
            <QuickAction to={`/companies/${company.id}`} icon={Building2} label="Company Profile" />
            <QuickAction to="/notifications" icon={ClipboardList} label="Notifications" />
          </div>
        </section>
      </div>
    </PageTransition>
  );
}

function QuickAction({ to, icon: Icon, label }: { to: string; icon: ElementType; label: string }) {
  return (
    <Link to={to} className="focus-ring flex items-center justify-between rounded-md border border-border bg-background px-3 py-3 text-sm font-medium transition-colors hover:bg-accent">
      <span className="inline-flex items-center gap-2">
        <Icon size={16} />
        {label}
      </span>
      <span className="text-muted-foreground">Open</span>
    </Link>
  );
}
