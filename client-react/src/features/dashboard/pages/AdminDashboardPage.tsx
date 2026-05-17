import { Building2, ClipboardCheck, Shield, UserCog, Users } from "lucide-react";
import type { ElementType } from "react";
import { Link } from "react-router-dom";
import { PageTransition } from "@/components/motion/PageTransition";
import { BrandPanel } from "@/components/shared/BrandPanel";
import { LoadingSkeleton } from "@/components/shared/LoadingSkeleton";
import { MetricTile } from "@/components/shared/MetricTile";
import { PageHeader } from "@/components/shared/PageHeader";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { useCompaniesQuery } from "@/features/companies/hooks/use-company-queries";
import {
  getPendingRoleRequests,
  useAdminRoleRequestsQuery,
  useUsersQuery,
} from "@/features/users/hooks/use-user-queries";

export function AdminDashboardPage() {
  const usersQuery = useUsersQuery();
  const companiesQuery = useCompaniesQuery();
  const roleRequestsQuery = useAdminRoleRequestsQuery();
  const users = usersQuery.data?.items ?? [];
  const companies = companiesQuery.data?.items ?? [];
  const pendingRoleRequests = getPendingRoleRequests(roleRequestsQuery.data?.items ?? []);
  const inactiveUsers = users.filter((user) => !user.active || user.status === "INACTIVE").length;

  if (usersQuery.isLoading || companiesQuery.isLoading || roleRequestsQuery.isLoading) {
    return (
      <PageTransition>
        <PageHeader title="Admin Dashboard" description="Loading system operations." />
        <LoadingSkeleton />
      </PageTransition>
    );
  }

  return (
    <PageTransition>
      <BrandPanel variant="hero" className="dashboard-hero dashboard-hero-admin p-5 sm:p-6 lg:p-7">
        <div className="flex flex-col gap-6 xl:flex-row xl:items-end xl:justify-between">
          <div className="min-w-0">
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-white/75">
              System operations
            </p>
            <h1 className="mt-2 max-w-3xl break-words text-2xl font-semibold tracking-tight text-white sm:text-3xl">
              Admin Dashboard
            </h1>
            <p className="mt-2 max-w-3xl text-sm leading-6 text-white/78">
              Monitor users, companies, account status, and role request queues from one control surface.
            </p>
            <div className="mt-4 flex flex-wrap gap-2">
              <StatusBadge tone="primary">admin</StatusBadge>
              <span className="brand-chip border-white/20 bg-white/10 text-white">
                {pendingRoleRequests.length} pending request{pendingRoleRequests.length === 1 ? "" : "s"}
              </span>
            </div>
          </div>
          <Link to="/admin/users" className="btn-primary focus-ring bg-white text-indigo-950 hover:bg-white/90">
            <UserCog size={16} />
            Review users
          </Link>
        </div>

        <div className="mt-6 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          <MetricTile variant="dark" icon={Users} label="Users" value={users.length} detail={usersQuery.isFetching ? "Refreshing" : "Total accounts"} />
          <MetricTile variant="dark" icon={Building2} label="Companies" value={companies.length} detail="Company records" />
          <MetricTile variant="dark" icon={Shield} label="Inactive users" value={inactiveUsers} detail="Needs attention" />
          <MetricTile variant="dark" icon={ClipboardCheck} label="Role requests" value={pendingRoleRequests.length} detail="Pending decisions" />
        </div>
      </BrandPanel>

      <div className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
        <section className="surface p-5">
          <div className="flex items-start justify-between gap-3">
            <div>
              <h2 className="text-lg font-semibold">Role request queue</h2>
              <p className="mt-1 text-sm text-muted-foreground">
                Review manager upgrades and HR promotion requests that require action.
              </p>
            </div>
            <StatusBadge tone={pendingRoleRequests.length ? "warning" : "success"}>
              {pendingRoleRequests.length ? "Pending" : "Clear"}
            </StatusBadge>
          </div>

          <div className="mt-4 space-y-3">
            {pendingRoleRequests.length ? (
              pendingRoleRequests.slice(0, 5).map((request) => (
                <div key={request.id} className="rounded-md border border-border bg-background px-3 py-3 text-sm">
                  <div className="flex items-center justify-between gap-3">
                    <p className="truncate font-medium">
                      {request.targetName || request.requesterName || `Request #${request.id}`}
                    </p>
                    <StatusBadge tone="warning">{request.status}</StatusBadge>
                  </div>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {request.type}
                    {" -> "}
                    {request.requestedRole}
                  </p>
                </div>
              ))
            ) : (
              <p className="rounded-md border border-border bg-background px-3 py-3 text-sm text-muted-foreground">
                No pending role requests.
              </p>
            )}
          </div>
        </section>

        <section className="surface p-5">
          <h2 className="text-lg font-semibold">Quick actions</h2>
          <div className="mt-4 grid gap-3">
            <QuickAction to="/admin/users" icon={Users} label="User Management" />
            <QuickAction to="/admin/companies" icon={Building2} label="Company Management" />
            <QuickAction to="/admin/users" icon={ClipboardCheck} label="Role Request Review" />
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
