import {
  Briefcase,
  ClipboardList,
  FolderKanban,
  Search,
  Shield,
  User,
} from "lucide-react";
import type { ElementType } from "react";
import { Link } from "react-router-dom";
import { PageTransition } from "@/components/motion/PageTransition";
import { StaggerItem, StaggerList } from "@/components/motion/StaggerList";
import { EmptyState } from "@/components/shared/EmptyState";
import { LoadingSkeleton } from "@/components/shared/LoadingSkeleton";
import { PageHeader } from "@/components/shared/PageHeader";
import { RetryState } from "@/components/shared/RetryState";
import { StatusBadge } from "@/components/shared/StatusBadge";
import {
  useMyProfileQuery,
  isProfileMissingError,
} from "@/features/profiles/hooks/use-profile-queries";
import { useProjectsByProfileQuery } from "@/features/projects/hooks/use-project-queries";
import { useAuthStore } from "@/stores/auth-store";
import { formatDate } from "@/lib/utils";
import type { Role } from "@/types/auth";
import type { ProfileDTO } from "@/types/profile";

const roleCopy: Record<Role, { label: string; value: string }> = {
  user: { label: "Applications", value: "Active" },
  hr: { label: "Hiring workspace", value: "Active" },
  manager: { label: "Company workspace", value: "Active" },
  admin: { label: "Admin tools", value: "Active" },
};

export function DashboardPage() {
  const user = useAuthStore((s) => s.user);
  const profileQuery = useMyProfileQuery();
  const profile = profileQuery.profile;
  const projectsQuery = useProjectsByProfileQuery(profile?.id);
  const projects = projectsQuery.data ?? [];

  if (profileQuery.isLoading) {
    return (
      <PageTransition>
        <PageHeader
          title="Dashboard"
          description="Loading your workspace overview."
        />
        <LoadingSkeleton />
      </PageTransition>
    );
  }

  if (profileQuery.error && !isProfileMissingError(profileQuery.error)) {
    return (
      <PageTransition>
        <PageHeader title="Dashboard" description="Your workspace overview." />
        <RetryState error={profileQuery.error} onRetry={profileQuery.refetch} />
      </PageTransition>
    );
  }

  const completion = getProfileCompletion(profile);
  const publicProjects = projects.filter((project) => project.display).length;
  const roleStat = roleCopy[user?.role ?? "user"];

  return (
    <PageTransition>
      <PageHeader
        title={`Welcome back${user?.name ? `, ${user.name}` : ""}`}
        description="Your profile, portfolio, and workspace signals in one place."
      />

      <StaggerList className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label="Profile status"
          value={profile ? `${completion.percent}%` : "Missing"}
          detail={profile ? "Profile completion" : "Create your profile"}
          icon={User}
        />
        <StatCard
          label="Projects"
          value={String(projects.length)}
          detail={projectsQuery.isFetching ? "Refreshing" : "Portfolio items"}
          icon={FolderKanban}
        />
        <StatCard
          label="Public projects"
          value={String(publicProjects)}
          detail="Visible on profile"
          icon={Search}
        />
        <StatCard
          label={roleStat.label}
          value={roleStat.value}
          detail="Role workspace"
          icon={Shield}
        />
      </StaggerList>

      <div className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
        <section className="rounded-lg border border-border bg-card p-5 shadow-sm">
          <div className="flex items-start justify-between gap-3">
            <div>
              <h2 className="text-lg font-semibold">Profile completion</h2>
              <p className="mt-1 text-sm text-muted-foreground">
                Complete fields that make your profile easier to evaluate.
              </p>
            </div>
            <StatusBadge tone={profile ? "success" : "warning"}>
              {profile ? "Active" : "Incomplete"}
            </StatusBadge>
          </div>

          <div className="mt-5 h-2 overflow-hidden rounded-full bg-muted">
            <div
              className="h-full rounded-full bg-primary transition-all duration-300"
              style={{ width: `${completion.percent}%` }}
            />
          </div>

          <div className="mt-4 grid gap-2 sm:grid-cols-2">
            {completion.items.map((item) => (
              <div
                key={item.label}
                className="flex items-center justify-between rounded-md border border-border px-3 py-2 text-sm"
              >
                <span className="text-muted-foreground">{item.label}</span>
                <StatusBadge tone={item.done ? "success" : "neutral"}>
                  {item.done ? "Done" : "Missing"}
                </StatusBadge>
              </div>
            ))}
          </div>

          <Link
            to="/profile"
            className="mt-5 inline-flex items-center gap-2 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
          >
            <User size={16} />
            {profile ? "Edit profile" : "Create profile"}
          </Link>
        </section>

        <section className="rounded-lg border border-border bg-card p-5 shadow-sm">
          <h2 className="text-lg font-semibold">Quick actions</h2>
          <div className="mt-4 grid gap-3">
            <QuickAction to="/profile" icon={User} label="My Profile" />
            <QuickAction to="/profiles" icon={Search} label="Browse Profiles" />
            <QuickAction
              to="/projects"
              icon={FolderKanban}
              label="My Projects"
            />
            <QuickAction to="/jobs" icon={Briefcase} label="Job Board" />
          </div>
        </section>
      </div>

      <section className="rounded-lg border border-border bg-card p-5 shadow-sm">
        <h2 className="text-lg font-semibold">Recent activity</h2>
        <div className="mt-4">
          {profile || projects.length ? (
            <div className="space-y-3">
              {profile && (
                <ActivityItem
                  label="Profile updated"
                  date={profile.updatedAt || profile.createdAt}
                />
              )}
              {projects.slice(0, 4).map((project) => (
                <ActivityItem
                  key={project.id}
                  label={`Project: ${project.title}`}
                  date={project.createAt}
                />
              ))}
            </div>
          ) : (
            <EmptyState
              icon={ClipboardList}
              title="No activity yet"
              description="Create a profile and add projects to start building your workspace history."
            />
          )}
        </div>
      </section>
    </PageTransition>
  );
}

function getProfileCompletion(profile: ProfileDTO | null) {
  const items = [
    { label: "Title", done: Boolean(profile?.title) },
    { label: "Type", done: Boolean(profile?.typeProfile) },
    { label: "Objective", done: Boolean(profile?.objective) },
    { label: "Skills", done: Boolean(profile?.skills) },
    {
      label: "Contact",
      done: Boolean(profile?.contact?.email || profile?.contact?.phone),
    },
    { label: "Avatar", done: Boolean(profile?.url) },
  ];
  const done = items.filter((item) => item.done).length;
  return { items, percent: Math.round((done / items.length) * 100) };
}

function StatCard({
  label,
  value,
  detail,
  icon: Icon,
}: {
  label: string;
  value: string;
  detail: string;
  icon: ElementType;
}) {
  return (
    <StaggerItem>
      <div className="rounded-lg border border-border bg-card p-5 shadow-sm">
        <div className="flex items-center justify-between gap-3">
          <p className="text-sm text-muted-foreground">{label}</p>
          <Icon size={18} className="text-muted-foreground" />
        </div>
        <p className="mt-3 text-2xl font-semibold">{value}</p>
        <p className="mt-1 text-xs text-muted-foreground">{detail}</p>
      </div>
    </StaggerItem>
  );
}

function QuickAction({
  to,
  icon: Icon,
  label,
}: {
  to: string;
  icon: ElementType;
  label: string;
}) {
  return (
    <Link
      to={to}
      className="flex items-center justify-between rounded-md border border-border px-3 py-3 text-sm font-medium transition-colors hover:bg-accent"
    >
      <span className="inline-flex items-center gap-2">
        <Icon size={16} />
        {label}
      </span>
      <span className="text-muted-foreground">Open</span>
    </Link>
  );
}

function ActivityItem({ label, date }: { label: string; date?: string }) {
  return (
    <div className="flex items-center justify-between gap-3 rounded-md border border-border px-3 py-2 text-sm">
      <span className="truncate text-foreground">{label}</span>
      <span className="shrink-0 text-xs text-muted-foreground">
        {formatDate(date)}
      </span>
    </div>
  );
}
