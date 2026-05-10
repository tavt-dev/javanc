"use client";

import Link from "next/link";
import { ArrowRight, BriefcaseBusiness, Building2, Search, UserRound } from "lucide-react";
import { PageHeader } from "@/components/page-header";
import { EmptyState, ErrorState, SkeletonGrid } from "@/components/data-state";
import { LinkButton, Pill } from "@/components/ui";
import { companyApi, jobApi, profileApi } from "@/lib/api";
import { useApi } from "@/lib/use-api";
import type { Company, Job, Profile } from "@/lib/types";
import { useLanguage } from "@/lib/i18n";

function Metric({ label, value, icon: Icon }: { label: string; value: number; icon: typeof UserRound }) {
  return (
    <div className="animate-card rounded-md border border-line bg-white p-4 shadow-soft">
      <div className="flex items-center justify-between gap-3">
        <span className="text-sm font-medium text-muted">{label}</span>
        <Icon className="h-5 w-5 text-brand" />
      </div>
      <p className="mt-3 text-3xl font-bold text-ink">{value}</p>
    </div>
  );
}

function ProfileCard({ profile }: { profile: Profile }) {
  return (
    <Link href={`/profiles/${profile.id}`} className="interactive-card animate-card rounded-md border border-line bg-white p-4 shadow-soft hover:border-brand">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-sm font-semibold text-ink">{profile.title || profile.objective || "Untitled profile"}</p>
          <p className="mt-1 line-clamp-2 text-sm text-muted">{profile.education || "No education summary yet"}</p>
        </div>
        <Pill tone="blue">{profile.typeProfile || "Profile"}</Pill>
      </div>
    </Link>
  );
}

function CompanyCard({ company }: { company: Company }) {
  return (
    <Link href="/companies" className="interactive-card animate-card rounded-md border border-line bg-white p-4 shadow-soft hover:border-brand">
      <p className="text-sm font-semibold text-ink">{company.name || "Unnamed company"}</p>
      <p className="mt-1 text-sm text-muted">{company.city || company.country || "Location not set"}</p>
      <p className="mt-3 line-clamp-2 text-sm text-muted">{company.description || "No company description yet"}</p>
    </Link>
  );
}

function JobCard({ job }: { job: Job }) {
  return (
    <Link href={`/jobs/${job.id}`} className="interactive-card animate-card rounded-md border border-line bg-white p-4 shadow-soft hover:border-brand">
      <div className="flex items-start justify-between gap-3">
        <p className="text-sm font-semibold text-ink">{job.title || "Untitled job"}</p>
        <Pill tone="green">{job.typeJob || "Job"}</Pill>
      </div>
      <p className="mt-3 line-clamp-2 text-sm text-muted">{job.description || "No description yet"}</p>
    </Link>
  );
}

export default function HomePage() {
  const { t } = useLanguage();
  const profiles = useApi(() => profileApi.list(), []);
  const companies = useApi(() => companyApi.list(), []);
  const jobs = useApi(() => jobApi.list(), []);

  return (
    <div className="space-y-8">
      <section className="rounded-md border border-line bg-white px-5 py-6 shadow-soft md:px-8 md:py-8">
        <div className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr] lg:items-center">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-brand">{t("home.eyebrow")}</p>
            <h1 className="mt-2 max-w-3xl text-3xl font-bold text-ink md:text-5xl">
              {t("home.title")}
            </h1>
            <p className="mt-4 max-w-2xl text-sm leading-6 text-muted">
              {t("home.description")}
            </p>
            <div className="mt-6 flex flex-wrap gap-3">
              <LinkButton href="/profiles">{t("home.browseProfiles")}</LinkButton>
              <LinkButton href="/jobs" variant="secondary">
                {t("home.viewJobs")}
              </LinkButton>
            </div>
          </div>
          <form className="rounded-md border border-line bg-canvas p-4">
            <label className="text-sm font-semibold text-ink">{t("home.searchLabel")}</label>
            <div className="mt-3 grid gap-3 sm:grid-cols-[1fr_140px_auto]">
              <input className="focus-ring rounded-md border border-line bg-white px-3 py-2 text-sm" placeholder={t("home.searchPlaceholder")} />
              <select className="focus-ring rounded-md border border-line bg-white px-3 py-2 text-sm">
                <option>{t("nav.profiles")}</option>
                <option>{t("nav.companies")}</option>
                <option>{t("nav.jobs")}</option>
              </select>
              <button className="focus-ring inline-flex items-center justify-center rounded-md bg-ink px-4 py-2 text-sm font-semibold text-white">
                <Search className="mr-2 h-4 w-4" />
                {t("home.searchButton")}
              </button>
            </div>
          </form>
        </div>
      </section>

      <div className="grid gap-4 md:grid-cols-3">
        <Metric label={t("home.metricProfiles")} value={profiles.data?.length ?? 0} icon={UserRound} />
        <Metric label={t("home.metricCompanies")} value={companies.data?.length ?? 0} icon={Building2} />
        <Metric label={t("home.metricJobs")} value={jobs.data?.length ?? 0} icon={BriefcaseBusiness} />
      </div>

      <section>
        <PageHeader
          eyebrow={t("home.talent")}
          title={t("home.discoverProfiles")}
          description={t("home.profileDescription")}
          actions={
            <Link href="/profiles" className="inline-flex items-center text-sm font-semibold text-brand">
              {t("home.allProfiles")} <ArrowRight className="ml-1 h-4 w-4" />
            </Link>
          }
        />
        {profiles.loading ? <SkeletonGrid count={6} /> : null}
        {profiles.error ? <ErrorState message={profiles.error} /> : null}
        {!profiles.loading && profiles.data?.length === 0 ? (
          <EmptyState title={t("home.noProfiles")} description={t("home.noProfilesDescription")} />
        ) : null}
        <div className="grid gap-4 md:grid-cols-3">
          {profiles.data?.slice(0, 6).map((profile) => <ProfileCard key={profile.id} profile={profile} />)}
        </div>
      </section>

      <section className="grid gap-6 lg:grid-cols-2">
        <div>
          <PageHeader eyebrow={t("nav.companies")} title={t("home.outstandingCompanies")} />
          <div className="grid gap-4">
            {companies.loading ? <SkeletonGrid count={3} /> : null}
            {companies.data?.slice(0, 3).map((company) => <CompanyCard key={company.id} company={company} />)}
            {!companies.loading && companies.data?.length === 0 ? (
              <EmptyState title={t("home.noCompanies")} description={t("home.noCompaniesDescription")} />
            ) : null}
          </div>
        </div>
        <div>
          <PageHeader eyebrow={t("nav.jobs")} title={t("home.openOpportunities")} />
          <div className="grid gap-4">
            {jobs.loading ? <SkeletonGrid count={3} /> : null}
            {jobs.data?.slice(0, 3).map((job) => <JobCard key={job.id} job={job} />)}
            {!jobs.loading && jobs.data?.length === 0 ? (
              <EmptyState title={t("home.noJobs")} description={t("home.noJobsDescription")} />
            ) : null}
          </div>
        </div>
      </section>
    </div>
  );
}
