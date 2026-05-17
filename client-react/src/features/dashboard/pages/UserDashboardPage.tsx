import {
  ArrowRight,
  BookOpen,
  Briefcase,
  Building2,
  ClipboardList,
  FolderKanban,
  Rocket,
  Search,
  Shield,
  Sparkles,
  TrendingUp,
  User,
} from "lucide-react";
import type { ElementType, FormEvent } from "react";
import { useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { PageTransition } from "@/components/motion/PageTransition";
import { EmptyState } from "@/components/shared/EmptyState";
import { LoadingSkeleton } from "@/components/shared/LoadingSkeleton";
import { PageHeader } from "@/components/shared/PageHeader";
import { RetryState } from "@/components/shared/RetryState";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { CompanyCard } from "@/features/companies/components/CompanyCard";
import { useCompaniesQuery } from "@/features/companies/hooks/use-company-queries";
import { JobCard } from "@/features/jobs/components/JobCard";
import {
  useAcceptedJobsQuery,
  useJobBoardQuery,
  usePendingJobsQuery,
} from "@/features/jobs/hooks/use-job-queries";
import { isJobOpen } from "@/features/jobs/utils/job-utils";
import {
  isProfileMissingError,
  useMyProfileQuery,
} from "@/features/profiles/hooks/use-profile-queries";
import { useMyProjectsQuery } from "@/features/projects/hooks/use-project-queries";
import { formatDate } from "@/lib/utils";
import { useAuthStore } from "@/stores/auth-store";
import type { CompanyDTO } from "@/types/company";
import type { TypeJob } from "@/types/job";
import type { ProfileDTO } from "@/types/profile";

type DashboardSearchState = {
  query: string;
  type: TypeJob | "";
  companyId: string;
  openOnly: boolean;
};

type DashboardArticle = {
  title: string;
  category: string;
  summary: string;
  readTime: string;
  href: string;
};

const articles: DashboardArticle[] = [
  {
    title: "How to make your Java profile recruiter-ready",
    category: "Profile",
    summary:
      "Turn projects, skills, and contact details into a profile that hiring teams can scan quickly.",
    readTime: "5 min read",
    href: "/profile",
  },
  {
    title: "Signals HR teams check before shortlisting",
    category: "Hiring",
    summary:
      "A practical look at openings, portfolio proof, and application status from the recruiter side.",
    readTime: "4 min read",
    href: "/jobs",
  },
  {
    title: "Build a project section that sells the outcome",
    category: "Portfolio",
    summary:
      "Write project cards around shipped value, stack, and responsibility instead of generic descriptions.",
    readTime: "6 min read",
    href: "/projects",
  },
];

export function UserDashboardPage() {
  const navigate = useNavigate();
  const user = useAuthStore((s) => s.user);
  const profileQuery = useMyProfileQuery();
  const profile = profileQuery.profile;
  const projectsQuery = useMyProjectsQuery(profile?.id);
  const jobsQuery = useJobBoardQuery(profile?.id);
  const companiesQuery = useCompaniesQuery();
  const pendingJobsQuery = usePendingJobsQuery(profile?.id);
  const acceptedJobsQuery = useAcceptedJobsQuery(profile?.id);

  const projects = projectsQuery.data?.items ?? [];
  const jobs = jobsQuery.data?.items ?? [];
  const companies = useMemo(() => companiesQuery.data?.items ?? [], [companiesQuery.data]);
  const pendingJobs = pendingJobsQuery.data?.items ?? [];
  const acceptedJobs = acceptedJobsQuery.data?.items ?? [];
  const [searchState, setSearchState] = useState<DashboardSearchState>({
    query: "",
    type: "",
    companyId: "",
    openOnly: true,
  });

  const companyMap = useMemo(
    () => new Map(companies.map((company) => [company.id, company.name])),
    [companies],
  );

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
  const openJobs = jobs.filter(isJobOpen).length;
  const recommendedJobs = jobs.slice(0, 6);
  const featuredCompanies = getFeaturedCompanies(companies);

  const updateSearch = <Key extends keyof DashboardSearchState>(
    key: Key,
    value: DashboardSearchState[Key],
  ) => {
    setSearchState((current) => ({ ...current, [key]: value }));
  };

  const submitSearch = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const params = new URLSearchParams();
    const trimmedQuery = searchState.query.trim();
    if (trimmedQuery) params.set("q", trimmedQuery);
    if (searchState.type) params.set("type", searchState.type);
    if (searchState.companyId) params.set("companyId", searchState.companyId);
    if (searchState.openOnly) params.set("openOnly", "true");
    const queryString = params.toString();
    navigate(`/jobs${queryString ? `?${queryString}` : ""}`);
  };

  return (
    <PageTransition>
      <section className="dashboard-market-hero p-5 sm:p-6 lg:p-8">
        <div className="relative z-10 grid gap-7 xl:grid-cols-[minmax(0,1.1fr)_minmax(330px,0.72fr)] xl:items-end">
          <div className="min-w-0">
            <div className="inline-flex items-center gap-2 rounded-full border border-white/18 bg-white/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.16em] text-white/78 shadow-sm backdrop-blur">
              <Sparkles size={14} />
              Career marketplace
            </div>
            <h1 className="mt-4 max-w-4xl break-words text-3xl font-semibold tracking-tight text-white sm:text-4xl lg:text-5xl">
              Welcome back{user?.name ? `, ${user.name}` : ""}. Find the next role that fits your profile
            </h1>
            <p className="mt-4 max-w-2xl text-sm leading-6 text-white/78 sm:text-base">
              Search open roles, compare hiring companies, and keep your profile,
              portfolio, and applications moving from one career dashboard.
            </p>
            <div className="mt-5 flex flex-wrap gap-2">
              <StatusBadge tone="lime">user</StatusBadge>
              <span className="brand-chip border-white/20 bg-white/10 text-white">
                {profile ? `${completion.percent}% profile complete` : "Profile onboarding"}
              </span>
              <span className="brand-chip border-white/20 bg-white/10 text-white">
                {openJobs} open jobs
              </span>
            </div>
          </div>

          <div className="dashboard-glow-card p-4">
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-primary">
              Today focus
            </p>
            <div className="mt-3 grid gap-3">
              <MiniSignal icon={Search} label="Recommended roles" value={recommendedJobs.length} />
              <MiniSignal icon={Building2} label="Hiring companies" value={companies.length} />
              <MiniSignal icon={ClipboardList} label="Pending applications" value={pendingJobs.length} />
              <MiniSignal icon={FolderKanban} label="Public projects" value={publicProjects} />
            </div>
          </div>
        </div>

        <form onSubmit={submitSearch} className="dashboard-search-bar relative z-10 mt-7 p-3">
          <div className="grid gap-3 lg:grid-cols-[minmax(0,1fr)_11rem_13rem_auto_auto] lg:items-center">
            <label className="relative block min-w-0">
              <span className="sr-only">Search jobs</span>
              <Search
                size={19}
                className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-primary"
              />
              <input
                value={searchState.query}
                onChange={(event) => updateSearch("query", event.target.value)}
                placeholder="Search jobs, skills, descriptions..."
                className="form-input h-12 rounded-lg pl-11 text-[0.95rem]"
              />
            </label>
            <select
              aria-label="Job type"
              value={searchState.type}
              onChange={(event) => updateSearch("type", event.target.value as TypeJob | "")}
              className="form-input h-12 rounded-lg"
            >
              <option value="">All types</option>
              <option value="java">Java</option>
              <option value="python">Python</option>
              <option value="php">PHP</option>
            </select>
            <select
              aria-label="Company"
              value={searchState.companyId}
              onChange={(event) => updateSearch("companyId", event.target.value)}
              className="form-input h-12 rounded-lg"
            >
              <option value="">All companies</option>
              {companies.map((company) => (
                <option key={company.id} value={company.id}>
                  {company.name}
                </option>
              ))}
            </select>
            <label className="brand-chip min-h-12 cursor-pointer justify-center bg-white/92 px-3 text-emerald-900 dark:bg-white/10 dark:text-emerald-50">
              <input
                type="checkbox"
                checked={searchState.openOnly}
                onChange={(event) => updateSearch("openOnly", event.target.checked)}
              />
              Open only
            </label>
            <button type="submit" className="btn-primary focus-ring h-12 justify-center px-5">
              <Rocket size={17} />
              Search jobs
            </button>
          </div>
        </form>
      </section>

      <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <DashboardStat
          icon={Briefcase}
          label="Open jobs"
          value={openJobs}
          detail={jobsQuery.isFetching ? "Refreshing marketplace" : "Available now"}
        />
        <DashboardStat
          icon={Building2}
          label="Companies"
          value={companies.length}
          detail={companiesQuery.isFetching ? "Refreshing directory" : "Hiring teams"}
        />
        <DashboardStat
          icon={User}
          label="Profile"
          value={profile ? `${completion.percent}%` : "Missing"}
          detail="Recruiter readiness"
        />
        <DashboardStat
          icon={ClipboardList}
          label="Applications"
          value={pendingJobs.length + acceptedJobs.length}
          detail={`${pendingJobs.length} pending, ${acceptedJobs.length} accepted`}
        />
      </section>

      <section className="grid gap-6 xl:grid-cols-[minmax(0,1.35fr)_minmax(330px,0.65fr)]">
        <div className="surface p-5">
          <SectionHeader
            eyebrow="Matched jobs"
            title="Recommended jobs"
            description="Fresh openings based on your current profile and marketplace filters."
            action="/jobs"
            actionLabel="View all"
          />
          <div className="mt-5">
            {jobsQuery.isLoading ? (
              <LoadingSkeleton variant="search" />
            ) : jobsQuery.error ? (
              <RetryState error={jobsQuery.error} onRetry={jobsQuery.refetch} />
            ) : recommendedJobs.length ? (
              <div className="grid gap-4 md:grid-cols-2 2xl:grid-cols-3">
                {recommendedJobs.map((job) => (
                  <JobCard
                    key={job.id}
                    job={job}
                    profileId={profile?.id}
                    companyName={companyMap.get(job.idCompany)}
                  />
                ))}
              </div>
            ) : (
              <EmptyState
                icon={Briefcase}
                title="No jobs yet"
                description="Check the job board again later or broaden your search filters."
              />
            )}
          </div>
        </div>

        <aside className="grid gap-6">
          <ProfileProgressCard profile={profile} completion={completion} />
          <section className="surface p-5">
            <h2 className="text-lg font-semibold">Quick actions</h2>
            <div className="mt-4 grid gap-3">
              <QuickAction to="/profile" icon={User} label={profile ? "Edit Profile" : "Create Profile"} />
              <QuickAction to="/projects" icon={FolderKanban} label="My Projects" />
              <QuickAction to="/my-applications" icon={ClipboardList} label="My Applications" />
              <QuickAction to="/jobs" icon={Briefcase} label="Job Board" />
            </div>
          </section>
        </aside>
      </section>

      <section className="surface p-5">
        <SectionHeader
          eyebrow="Companies"
          title="Featured companies"
          description="Browse hiring teams and open company workspaces."
          action="/companies"
          actionLabel="Explore companies"
        />
        <div className="dashboard-company-strip mt-5 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {companiesQuery.isLoading ? (
            <LoadingSkeleton variant="cards" />
          ) : featuredCompanies.length ? (
            featuredCompanies.map((company) => <CompanyCard key={company.id} company={company} />)
          ) : (
            <EmptyState
              icon={Building2}
              title="No companies yet"
              description="Company directory is empty right now."
            />
          )}
        </div>
      </section>

      <section className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_minmax(320px,0.45fr)]">
        <div className="surface p-5">
          <SectionHeader
            eyebrow="Career insights"
            title="Articles for your next move"
            description="Short guidance blocks to tighten your profile, portfolio, and applications."
            action="/profile"
            actionLabel="Improve profile"
          />
          <div className="mt-5 grid gap-4 md:grid-cols-3">
            {articles.map((article) => (
              <ArticleCard key={article.title} article={article} />
            ))}
          </div>
        </div>

        <section className="dashboard-glow-card p-5">
          <div className="flex items-start gap-3">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-primary/12 text-primary">
              <TrendingUp size={21} />
            </div>
            <div className="min-w-0">
              <h2 className="text-lg font-semibold">Recent activity</h2>
              <p className="mt-1 text-sm text-muted-foreground">
                Profile and portfolio changes that shape your hiring signal.
              </p>
            </div>
          </div>
          <div className="mt-4">
            {profile || projects.length ? (
              <div className="space-y-3">
                {profile && <ActivityItem label="Profile updated" date={profile.updatedAt || profile.createdAt} />}
                {projects.slice(0, 4).map((project) => (
                  <ActivityItem key={project.id} label={`Project: ${project.title}`} date={project.createAt} />
                ))}
              </div>
            ) : (
              <EmptyState
                icon={Shield}
                title="No activity yet"
                description="Create a profile and add projects to start building your workspace history."
              />
            )}
          </div>
        </section>
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

function getFeaturedCompanies(companies: CompanyDTO[]) {
  return [...companies]
    .sort((a, b) => (b.idJobs?.length ?? 0) - (a.idJobs?.length ?? 0))
    .slice(0, 4);
}

function MiniSignal({
  icon: Icon,
  label,
  value,
}: {
  icon: ElementType;
  label: string;
  value: string | number;
}) {
  return (
    <div className="flex items-center justify-between gap-3 rounded-lg border border-border/70 bg-background/72 px-3 py-2.5">
      <span className="inline-flex min-w-0 items-center gap-2 text-sm text-muted-foreground">
        <Icon size={16} className="shrink-0 text-primary" />
        <span className="truncate">{label}</span>
      </span>
      <span className="text-sm font-semibold text-foreground">{value}</span>
    </div>
  );
}

function DashboardStat({
  icon: Icon,
  label,
  value,
  detail,
}: {
  icon: ElementType;
  label: string;
  value: string | number;
  detail: string;
}) {
  return (
    <article className="dashboard-glow-card p-4">
      <div className="flex items-center justify-between gap-3">
        <p className="truncate text-sm font-medium text-muted-foreground">{label}</p>
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary/12 text-primary">
          <Icon size={18} />
        </div>
      </div>
      <p className="mt-3 truncate text-2xl font-semibold text-foreground">{value}</p>
      <p className="mt-1 truncate text-xs text-muted-foreground">{detail}</p>
    </article>
  );
}

function SectionHeader({
  eyebrow,
  title,
  description,
  action,
  actionLabel,
}: {
  eyebrow: string;
  title: string;
  description: string;
  action: string;
  actionLabel: string;
}) {
  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
      <div className="min-w-0">
        <p className="text-xs font-semibold uppercase tracking-[0.14em] text-primary">
          {eyebrow}
        </p>
        <h2 className="mt-1 text-xl font-semibold tracking-tight text-foreground">{title}</h2>
        <p className="mt-1 max-w-2xl text-sm text-muted-foreground">{description}</p>
      </div>
      <Link to={action} className="focus-ring inline-flex shrink-0 items-center gap-2 rounded-md text-sm font-semibold text-primary hover:underline">
        {actionLabel}
        <ArrowRight size={16} />
      </Link>
    </div>
  );
}

function ProfileProgressCard({
  profile,
  completion,
}: {
  profile: ProfileDTO | null;
  completion: ReturnType<typeof getProfileCompletion>;
}) {
  return (
    <section className="dashboard-glow-card p-5">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-primary">
            Profile readiness
          </p>
          <h2 className="mt-1 text-lg font-semibold">Complete recruiter signals</h2>
        </div>
        <StatusBadge tone={profile ? "success" : "warning"}>
          {profile ? "Active" : "Incomplete"}
        </StatusBadge>
      </div>

      <div className="mt-5 h-2.5 overflow-hidden rounded-full bg-muted ring-1 ring-border">
        <div className="h-full rounded-full bg-primary shadow-sm transition-all duration-300" style={{ width: `${completion.percent}%` }} />
      </div>

      <div className="mt-4 grid gap-2">
        {completion.items.map((item) => (
          <div key={item.label} className="flex items-center justify-between gap-3 rounded-md border border-border bg-background/60 px-3 py-2 text-sm">
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
  );
}

function ArticleCard({ article }: { article: DashboardArticle }) {
  return (
    <article className="dashboard-article-card p-4">
      <div className="flex items-center justify-between gap-3">
        <StatusBadge tone="cyan">{article.category}</StatusBadge>
        <span className="text-xs text-muted-foreground">{article.readTime}</span>
      </div>
      <h3 className="mt-4 text-base font-semibold leading-6 text-foreground">{article.title}</h3>
      <p className="mt-2 line-clamp-3 text-sm leading-6 text-muted-foreground">
        {article.summary}
      </p>
      <Link to={article.href} className="focus-ring mt-5 inline-flex items-center gap-2 rounded-md text-sm font-semibold text-primary hover:underline">
        Read guide
        <BookOpen size={15} />
      </Link>
    </article>
  );
}

function QuickAction({ to, icon: Icon, label }: { to: string; icon: ElementType; label: string }) {
  return (
    <Link to={to} className="focus-ring flex items-center justify-between rounded-md border border-border bg-background/70 px-3 py-3 text-sm font-medium transition-colors hover:bg-accent">
      <span className="inline-flex items-center gap-2">
        <Icon size={16} className="text-primary" />
        {label}
      </span>
      <span className="text-muted-foreground">Open</span>
    </Link>
  );
}

function ActivityItem({ label, date }: { label: string; date?: string }) {
  return (
    <div className="flex items-center justify-between gap-3 rounded-md border border-border bg-background/68 px-3 py-2 text-sm">
      <span className="truncate text-foreground">{label}</span>
      <span className="shrink-0 text-xs text-muted-foreground">{formatDate(date)}</span>
    </div>
  );
}
