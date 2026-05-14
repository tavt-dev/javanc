"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { ArrowRight, BriefcaseBusiness, Building2, ChevronDown, Search, UserRound } from "lucide-react";
import { PageHeader } from "@/components/page-header";
import { EmptyState, ErrorState, SkeletonGrid } from "@/components/data-state";
import { CompanyPreviewCard, JobPreviewCard, ProfilePreviewCard } from "@/components/item-previews";
import { LinkButton } from "@/components/ui";
import { companyApi, jobApi, profileApi } from "@/lib/api";
import { useApi } from "@/lib/use-api";
import { useLanguage } from "@/lib/i18n";

function Metric({ label, value, icon: Icon }: { label: string; value: number; icon: typeof UserRound }) {
  return (
    <div className="glass-panel animate-card scroll-reveal rounded-md p-5">
      <div className="flex items-center justify-between gap-3">
        <span className="text-sm font-medium text-muted">{label}</span>
        <Icon className="h-5 w-5 text-accent" />
      </div>
      <div className="mt-4 h-px bg-white/15" />
      <p className="mt-4 text-3xl font-bold text-ink">{value}</p>
    </div>
  );
}

function SearchCategoryDropdown({
  options,
  value,
  onChange
}: {
  options: string[];
  value: string;
  onChange: (value: string) => void;
}) {
  const [open, setOpen] = useState(false);

  return (
    <div className="relative border-t border-line sm:border-l sm:border-t-0">
      <button
        type="button"
        className="pressable flex min-h-14 w-full items-center justify-between gap-3 bg-white px-5 text-left text-sm font-semibold text-ink hover:bg-slate-50 sm:w-[190px]"
        onClick={() => setOpen((current) => !current)}
        aria-expanded={open}
      >
        {value}
        <ChevronDown className={`h-4 w-4 text-muted transition ${open ? "rotate-180" : ""}`} />
      </button>
      {open ? (
        <div className="absolute left-2 right-2 top-[calc(100%+8px)] z-50 overflow-hidden rounded-md border border-slate-200 bg-white text-ink shadow-[0_18px_45px_rgba(8,8,32,0.22)]">
          {options.map((option) => (
            <button
              key={option}
              type="button"
              className={`pressable flex w-full px-4 py-2.5 text-left text-sm font-semibold hover:bg-slate-50 ${
                option === value ? "bg-indigo-50 text-brand" : ""
              }`}
              onClick={() => {
                onChange(option);
                setOpen(false);
              }}
            >
              {option}
            </button>
          ))}
        </div>
      ) : null}
    </div>
  );
}

export default function HomePage() {
  const { t } = useLanguage();
  const [searchCategory, setSearchCategory] = useState(t("nav.profiles"));
  const searchOptions = [t("nav.profiles"), t("nav.companies"), t("nav.jobs")];
  useEffect(() => setSearchCategory(t("nav.profiles")), [t]);
  const profiles = useApi(() => profileApi.list({ page: 0, size: 6, sort: "hot" }), []);
  const companies = useApi(() => companyApi.list({ page: 0, size: 6, sort: "hot" }), []);
  const jobs = useApi(() => jobApi.list({ page: 0, size: 6, sort: "hot" }), []);
  const companyById = useMemo(() => new Map((companies.data ?? []).map((company) => [company.id, company])), [companies.data]);

  return (
    <div className="space-y-8">
      <section className="px-2 pb-8 pt-8 md:px-6 md:pb-12 md:pt-14">
        <div className="mx-auto max-w-6xl text-center">
          <p className="text-xs font-semibold uppercase tracking-wide text-accent">{t("home.eyebrow")}</p>
          <h1 className="mx-auto mt-5 max-w-4xl font-serif text-4xl font-bold leading-tight text-white md:text-6xl">
              {t("home.title")}
          </h1>
          <p className="mx-auto mt-5 max-w-2xl text-base leading-7 text-white/70">
              {t("home.description")}
          </p>
          <div className="mt-8 flex flex-wrap justify-center gap-3">
              <LinkButton href="/profiles">{t("home.browseProfiles")}</LinkButton>
              <LinkButton href="/jobs" variant="secondary">
                {t("home.viewJobs")}
              </LinkButton>
          </div>
          <form className="relative z-10 mx-auto mt-10 max-w-5xl rounded-[28px] border border-white/10 bg-white shadow-soft">
            <div className="grid overflow-visible rounded-[28px] sm:grid-cols-[1fr_180px_auto]">
              <input className="min-h-14 rounded-l-[28px] border-0 bg-white px-5 text-sm text-ink caret-ink outline-none placeholder:text-slate-400 [color-scheme:light] focus:ring-0" placeholder={t("home.searchPlaceholder")} />
              <SearchCategoryDropdown options={searchOptions} value={searchCategory} onChange={setSearchCategory} />
              <button className="focus-ring pressable inline-flex min-h-14 items-center justify-center rounded-r-[28px] bg-accent px-6 text-sm font-semibold text-ink hover:bg-yellow-300">
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
          {profiles.data?.slice(0, 6).map((profile) => (
            <ProfilePreviewCard key={profile.id} profile={profile} href={`/profiles/${profile.id}`} surface="glass" fallback={t("state.untitledProfile")} />
          ))}
        </div>
      </section>

      <section className="grid gap-6 lg:grid-cols-2">
        <div>
          <PageHeader eyebrow={t("nav.companies")} title={t("home.outstandingCompanies")} />
          <div className="grid gap-4">
            {companies.loading ? <SkeletonGrid count={3} /> : null}
            {companies.data?.slice(0, 3).map((company) => <CompanyPreviewCard key={company.id} company={company} href="/companies" surface="glass" />)}
            {!companies.loading && companies.data?.length === 0 ? (
              <EmptyState title={t("home.noCompanies")} description={t("home.noCompaniesDescription")} />
            ) : null}
          </div>
        </div>
        <div>
          <PageHeader eyebrow={t("nav.jobs")} title={t("home.openOpportunities")} />
          <div className="grid gap-4">
            {jobs.loading ? <SkeletonGrid count={3} /> : null}
            {jobs.data?.slice(0, 3).map((job) => (
              <JobPreviewCard key={job.id} job={job} company={companyById.get(job.idCompany)} href={`/jobs/${job.id}`} surface="glass" />
            ))}
            {!jobs.loading && jobs.data?.length === 0 ? (
              <EmptyState title={t("home.noJobs")} description={t("home.noJobsDescription")} />
            ) : null}
          </div>
        </div>
      </section>
    </div>
  );
}
