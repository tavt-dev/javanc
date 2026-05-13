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
  isProfileMissingError,
  useMyProfileQuery,
} from "@/features/profiles/hooks/use-profile-queries";
import { useMyProjectsQuery } from "@/features/projects/hooks/use-project-queries";
import { formatDate } from "@/lib/utils";
import { useAuthStore } from "@/stores/auth-store";
import type { ProfileDTO } from "@/types/profile";

export function UserDashboardPage() {
  const user = useAuthStore((s) => s.user);
  const profileQuery = useMyProfileQuery();
  const profile = profileQuery.profile;
  const projectsQuery = useMyProjectsQuery(profile?.id);
  const projects = projectsQuery.data ?? [];

  if (profileQuery.isLoading) {
    return (
      <PageTransition>
        <PageHeader title="User Dashboard" description="Loading your career workspace." />
        <LoadingSkeleton />
      </PageTransition>
    );
  }

  if (profileQuery.error && !isProfileMissingError(profileQuery.error)) {
    return (
      <PageTransition>
        <PageHeader title="User Dashboard" description="Your career workspace." />
        <RetryState error={profileQuery.error} onRetry={profileQuery.refetch} />
      </PageTransition>
    );
  }

  const completion = getProfileCompletion(profile);
  const publicProjects = projects.filter((project) => project.display).length;

  return (
    <PageTransition>
      <BrandPanel variant="hero" className="dashboard-hero dashboard-hero-user p-5 sm:p-6 lg:p-7">
        <div className="flex flex-col gap-6 xl:flex-row xl:items-end xl:justify-between">
          <div className="min-w-0">
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-white/75">
              Career workspace
            </p>
            <h1 className="mt-2 max-w-3xl break-words text-2xl font-semibold tracking-tight text-white sm:text-3xl">
              Welcome back{user?.name ? `, ${user.name}` : ""}
            </h1>
            <p className="mt-2 max-w-3xl text-sm leading-6 text-white/78">
              Manage your profile, portfolio, applications, and job discovery from one focused dashboard.
            </p>
            <div className="mt-4 flex flex-wrap gap-2">
              <StatusBadge tone="lime">user</StatusBadge>
              <span className="brand-chip border-white/20 bg-white/10 text-white">
                {profile ? "Profile active" : "Profile onboarding"}
              </span>
            </div>
          </div>
          <Link to="/jobs" className="btn-primary focus-ring bg-white text-emerald-900 hover:bg-white/90">
            <Search size={16} />
            Explore jobs
          </Link>
        </div>

        <div className="mt-6 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          <MetricTile variant="dark" icon={User} label="Profile" value={profile ? `${completion.percent}%` : "Missing"} detail="Completion" />
          <MetricTile variant="dark" icon={FolderKanban} label="Projects" value={projects.length} detail="Portfolio items" />
          <MetricTile variant="dark" icon={Search} label="Public projects" value={publicProjects} detail="Visible on profile" />
          <MetricTile variant="dark" icon={Shield} label="Workspace" value="Active" detail="Career account" />
        </div>
      </BrandPanel>

      <div className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
        <section className="surface p-5">
          <div className="flex items-start justify-between gap-3">
            <div>
              <h2 className="text-lg font-semibold">Profile completion</h2>
              <p className="mt-1 text-sm text-muted-foreground">
                Complete the fields recruiters and HR teams evaluate first.
              </p>
            </div>
            <StatusBadge tone={profile ? "success" : "warning"}>
              {profile ? "Active" : "Incomplete"}
            </StatusBadge>
          </div>

          <div className="mt-5 h-2.5 overflow-hidden rounded-full bg-muted ring-1 ring-border">
            <div className="h-full rounded-full bg-primary shadow-sm transition-all duration-300" style={{ width: `${completion.percent}%` }} />
          </div>

          <div className="mt-4 grid gap-2 sm:grid-cols-2">
            {completion.items.map((item) => (
              <div key={item.label} className="flex items-center justify-between gap-3 rounded-md border border-border bg-background px-3 py-2 text-sm">
                <span className="text-muted-foreground">{item.label}</span>
                <StatusBadge tone={item.done ? "success" : "neutral"}>
                  {item.done ? "Done" : "Missing"}
                </StatusBadge>
              </div>
            ))}
          </div>

          <Link to="/profile" className="btn-primary focus-ring mt-5">
            <User size={16} />
            {profile ? "Edit profile" : "Create profile"}
          </Link>
        </section>

        <section className="surface p-5">
          <h2 className="text-lg font-semibold">Quick actions</h2>
          <div className="mt-4 grid gap-3">
            <QuickAction to="/profile" icon={User} label="My Profile" />
            <QuickAction to="/projects" icon={FolderKanban} label="My Projects" />
            <QuickAction to="/my-applications" icon={ClipboardList} label="My Applications" />
            <QuickAction to="/jobs" icon={Briefcase} label="Job Board" />
          </div>
        </section>
      </div>

      <section className="surface p-5">
        <h2 className="text-lg font-semibold">Recent activity</h2>
        <div className="mt-4">
          {profile || projects.length ? (
            <div className="space-y-3">
              {profile && <ActivityItem label="Profile updated" date={profile.updatedAt || profile.createdAt} />}
              {projects.slice(0, 4).map((project) => (
                <ActivityItem key={project.id} label={`Project: ${project.title}`} date={project.createAt} />
              ))}
            </div>
          ) : (
            <EmptyState icon={ClipboardList} title="No activity yet" description="Create a profile and add projects to start building your workspace history." />
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
    { label: "Contact", done: Boolean(profile?.contact?.email || profile?.contact?.phone) },
    { label: "Avatar", done: Boolean(profile?.url) },
  ];
  const done = items.filter((item) => item.done).length;
  return { items, percent: Math.round((done / items.length) * 100) };
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

function ActivityItem({ label, date }: { label: string; date?: string }) {
  return (
    <div className="flex items-center justify-between gap-3 rounded-md border border-border bg-background px-3 py-2 text-sm">
      <span className="truncate text-foreground">{label}</span>
      <span className="shrink-0 text-xs text-muted-foreground">{formatDate(date)}</span>
    </div>
  );
}
