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
import { BrandPanel } from "@/components/shared/BrandPanel";
import { EmptyState } from "@/components/shared/EmptyState";
import { LoadingSkeleton } from "@/components/shared/LoadingSkeleton";
import { MetricTile } from "@/components/shared/MetricTile";
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
  const projects = projectsQuery.data?.items ?? [];

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
      <BrandPanel variant="hero" className="p-5 sm:p-6 lg:p-7">
        <div className="flex flex-col gap-6 xl:flex-row xl:items-end xl:justify-between">
          <div className="min-w-0">
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-emerald-100/75">
              Career command center
            </p>
            <h1 className="mt-2 max-w-3xl break-words text-2xl font-semibold tracking-tight text-white sm:text-3xl">
              Welcome back{user?.name ? `, ${user.name}` : ""}
            </h1>
            <p className="mt-2 max-w-3xl text-sm leading-6 text-emerald-50/75">
              Search opportunities, improve your hiring profile, and keep role workspace signals in one focused console.
            </p>
            <div className="mt-4 flex flex-wrap gap-2">
              {user?.role && <StatusBadge tone="lime">{user.role}</StatusBadge>}
              <span className="brand-chip border-white/15 bg-white/10 text-emerald-50">
                {profile ? "Profile active" : "Profile onboarding"}
              </span>
            </div>
          </div>
          <Link to="/jobs" className="btn-primary focus-ring bg-white text-emerald-800 hover:bg-emerald-50">
            <Search size={16} />
            Explore jobs
          </Link>
        </div>
        <div className="mt-6 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          <MetricTile
            variant="dark"
            label="Profile status"
            value={profile ? `${completion.percent}%` : "Missing"}
            detail={profile ? "Profile completion" : "Create your profile"}
            icon={User}
          />
          <MetricTile
            variant="dark"
            label="Projects"
            value={projects.length}
            detail={projectsQuery.isFetching ? "Refreshing" : "Portfolio items"}
            icon={FolderKanban}
          />
          <MetricTile
            variant="dark"
            label="Public projects"
            value={publicProjects}
            detail="Visible on profile"
            icon={Search}
          />
          <MetricTile
            variant="dark"
            label={roleStat.label}
            value={roleStat.value}
            detail="Role workspace"
            icon={Shield}
          />
        </div>
      </BrandPanel>

      <div className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
        <section className="surface p-5">
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

          <div className="mt-5 h-2.5 overflow-hidden rounded-full bg-muted ring-1 ring-border">
            <div
              className="h-full rounded-full bg-primary shadow-sm transition-all duration-300"
              style={{ width: `${completion.percent}%` }}
            />
          </div>

          <div className="mt-4 grid gap-2 sm:grid-cols-2">
            {completion.items.map((item) => (
              <div
                key={item.label}
                className="flex items-center justify-between gap-3 rounded-md border border-border bg-background/40 px-3 py-2 text-sm"
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
            className="btn-primary focus-ring mt-5"
          >
            <User size={16} />
            {profile ? "Edit profile" : "Create profile"}
          </Link>
        </section>

        <section className="surface p-5">
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

      <section className="surface p-5">
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
      className="focus-ring flex items-center justify-between rounded-md border border-border bg-background/40 px-3 py-3 text-sm font-medium transition-colors hover:bg-accent"
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
    <div className="flex items-center justify-between gap-3 rounded-md border border-border bg-background/40 px-3 py-2 text-sm">
      <span className="truncate text-foreground">{label}</span>
      <span className="shrink-0 text-xs text-muted-foreground">
        {formatDate(date)}
      </span>
    </div>
  );
}
