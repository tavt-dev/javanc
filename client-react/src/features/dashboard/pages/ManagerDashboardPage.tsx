import { Briefcase, Building2, ClipboardList, UserPlus, Users } from "lucide-react";
import type { ElementType } from "react";
import { Link } from "react-router-dom";
import { PageTransition } from "@/components/motion/PageTransition";
import { BrandPanel } from "@/components/shared/BrandPanel";
import { EmptyState } from "@/components/shared/EmptyState";
import { LoadingSkeleton } from "@/components/shared/LoadingSkeleton";
import { MetricTile } from "@/components/shared/MetricTile";
import { PageHeader } from "@/components/shared/PageHeader";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { useMyManagedCompanyQuery } from "@/features/companies/hooks/use-company-queries";
import { useJobsByCompanyQuery } from "@/features/jobs/hooks/use-job-queries";
import { useMyRoleRequestsQuery } from "@/features/users/hooks/use-user-queries";

export function ManagerDashboardPage() {
  const companyQuery = useMyManagedCompanyQuery();
  const company = companyQuery.data ?? null;
  const jobsQuery = useJobsByCompanyQuery(company?.id);
  const roleRequestsQuery = useMyRoleRequestsQuery();
  const jobs = jobsQuery.data ?? [];
  const hrInvitations = (roleRequestsQuery.data ?? []).filter(
    (request) => request.type === "HR_PROMOTION",
  );
  const pendingHrInvitations = hrInvitations.filter(
    (request) => request.status === "PENDING_USER_CONFIRMATION",
  ).length;

  if (companyQuery.isLoading) {
    return (
      <PageTransition>
        <PageHeader title="Manager Dashboard" description="Loading company operations." />
        <LoadingSkeleton />
      </PageTransition>
    );
  }

  if (companyQuery.error || !company) {
    return (
      <PageTransition>
        <PageHeader title="Manager Dashboard" description="Company operations." />
        <EmptyState
          icon={Building2}
          title="No company assigned"
          description="This manager account needs an assigned company before operating a company workspace."
        />
      </PageTransition>
    );
  }

  return (
    <PageTransition>
      <BrandPanel variant="hero" className="dashboard-hero dashboard-hero-manager p-5 sm:p-6 lg:p-7">
        <div className="flex flex-col gap-6 xl:flex-row xl:items-end xl:justify-between">
          <div className="min-w-0">
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-white/75">
              Company operations
            </p>
            <h1 className="mt-2 max-w-3xl break-words text-2xl font-semibold tracking-tight text-white sm:text-3xl">
              {company.name}
            </h1>
            <p className="mt-2 max-w-3xl text-sm leading-6 text-white/78">
              Track company profile readiness, HR assignment, job activity, and invitation status.
            </p>
            <div className="mt-4 flex flex-wrap gap-2">
              <StatusBadge tone="lime">manager</StatusBadge>
              <span className="brand-chip border-white/20 bg-white/10 text-white">
                {company.type || "Company workspace"}
              </span>
            </div>
          </div>
          <Link to="/manager/company" className="btn-primary focus-ring bg-white text-emerald-950 hover:bg-white/90">
            <Building2 size={16} />
            Edit company
          </Link>
        </div>

        <div className="mt-6 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          <MetricTile variant="dark" icon={Users} label="HR accounts" value={company.idHR?.length ?? 0} detail="Assigned HR" />
          <MetricTile variant="dark" icon={Briefcase} label="Jobs" value={jobs.length || company.idJobs?.length || 0} detail={jobsQuery.isFetching ? "Refreshing" : "Company jobs"} />
          <MetricTile variant="dark" icon={UserPlus} label="Pending invites" value={pendingHrInvitations} detail="HR invitations" />
          <MetricTile variant="dark" icon={Building2} label="Company status" value={company.idManager ? "Assigned" : "Open"} detail={`ID ${company.id}`} />
        </div>
      </BrandPanel>

      <div className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
        <section className="surface p-5">
          <div className="flex items-start justify-between gap-3">
            <div>
              <h2 className="text-lg font-semibold">Company snapshot</h2>
              <p className="mt-1 text-sm text-muted-foreground">
                Operational profile and hiring capacity for your company.
              </p>
            </div>
            <StatusBadge tone={company.idHR?.length ? "success" : "warning"}>
              {company.idHR?.length ? "HR assigned" : "Needs HR"}
            </StatusBadge>
          </div>

          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            <Info label="Email" value={company.email || "No email"} />
            <Info label="Phone" value={company.phone || "No phone"} />
            <Info label="Location" value={[company.city, company.country].filter(Boolean).join(", ") || "No location"} />
            <Info label="Open jobs" value={String(jobs.length || company.idJobs?.length || 0)} />
          </div>

          <p className="mt-4 rounded-md border border-border bg-background px-3 py-3 text-sm leading-6 text-muted-foreground">
            {company.description || "No company description provided yet."}
          </p>
        </section>

        <section className="surface p-5">
          <h2 className="text-lg font-semibold">Quick actions</h2>
          <div className="mt-4 grid gap-3">
            <QuickAction to="/manager/company" icon={Building2} label="My Company" />
            <QuickAction to="/manager/hr" icon={UserPlus} label="Manage HR" />
            <QuickAction to={`/companies/${company.id}`} icon={ClipboardList} label="Public Company Page" />
          </div>
        </section>
      </div>
    </PageTransition>
  );
}

function Info({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-md border border-border bg-background px-3 py-3">
      <p className="text-xs font-semibold uppercase tracking-[0.12em] text-muted-foreground">{label}</p>
      <p className="mt-1 truncate text-sm font-medium text-foreground">{value}</p>
    </div>
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
