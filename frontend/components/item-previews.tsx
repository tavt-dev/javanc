"use client";

import Link from "next/link";
import type { ComponentType, ReactNode } from "react";
import {
  BriefcaseBusiness,
  Building2,
  CheckCircle2,
  GraduationCap,
  Mail,
  MapPin,
  Phone,
  Sparkles,
  UserRound,
  UsersRound
} from "lucide-react";
import { Pill } from "@/components/ui";
import { imageApi } from "@/lib/api";
import { useApi } from "@/lib/use-api";
import { initials } from "@/lib/format";
import { useLanguage } from "@/lib/i18n";
import type { Company, Job, Profile } from "@/lib/types";

type Surface = "light" | "glass";
type Icon = ComponentType<{ className?: string }>;

function surfaceClass(surface: Surface, className = "") {
  const base = "interactive-card scroll-reveal rounded-md p-5 transition hover:border-brand";
  const styles =
    surface === "glass"
      ? "glass-panel animate-card hover:border-accent/70"
      : "border border-line bg-white shadow-soft";
  return `${base} ${styles} ${className}`;
}

function PreviewShell({
  href,
  surface,
  className,
  children
}: {
  href?: string;
  surface: Surface;
  className?: string;
  children: ReactNode;
}) {
  const classes = surfaceClass(surface, className);

  if (href) {
    return (
      <Link href={href} className={classes}>
        {children}
      </Link>
    );
  }

  return <article className={classes}>{children}</article>;
}

function ImageBadge({
  url,
  label,
  icon: IconComponent = UserRound,
  size = "large"
}: {
  url?: string;
  label: string;
  icon?: Icon;
  size?: "medium" | "large";
}) {
  const preview = useApi(
    () => (url ? imageApi.previewUrl(url, size === "large" ? 160 : 96).catch(() => url ?? null) : Promise.resolve(null)),
    [url, size]
  );
  const sizeClass = size === "large" ? "h-20 w-20" : "h-16 w-16";

  return (
    <div className={`${sizeClass} flex shrink-0 items-center justify-center overflow-hidden rounded-md border border-line bg-slate-100 text-lg font-bold text-brand`}>
      {preview.data ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={preview.data} alt={label} className="h-full w-full object-cover" />
      ) : label.trim() ? (
        <span>{initials(label)}</span>
      ) : (
        <IconComponent className="h-6 w-6" />
      )}
    </div>
  );
}

function DetailChip({
  icon: IconComponent,
  children,
  tone = "neutral"
}: {
  icon: Icon;
  children: ReactNode;
  tone?: "neutral" | "accent";
}) {
  const toneClass = tone === "accent" ? "bg-accent/20 text-ink" : "bg-canvas/5 text-muted";

  return (
    <span className={`inline-flex min-h-8 items-center gap-1.5 rounded-md px-2.5 py-1 text-xs font-semibold ${toneClass}`}>
      <IconComponent className="h-3.5 w-3.5 shrink-0" />
      <span className="line-clamp-1 break-all">{children}</span>
    </span>
  );
}

function skillTags(value?: string) {
  return (value ?? "")
    .split(/[\n,;|]+/)
    .map((item) => item.replace(/^[-*]\s*/, "").trim())
    .filter(Boolean)
    .slice(0, 4);
}

function locationText(company?: Company, fallback = "Location not set") {
  return [company?.city, company?.country].filter(Boolean).join(", ") || company?.street || fallback;
}

export function ProfilePreviewCard({
  profile,
  href,
  surface = "light",
  fallback = "Untitled profile"
}: {
  profile: Profile;
  href?: string;
  surface?: Surface;
  fallback?: string;
}) {
  const { t } = useLanguage();
  const title = profile.name || profile.title || profile.objective || fallback;
  const skills = skillTags(profile.skills);
  const summary = profile.objective || profile.workExperience || profile.education || t("state.noSummary");

  return (
    <PreviewShell href={href} surface={surface}>
      <div className="flex items-start gap-4">
        <ImageBadge url={profile.url} label={title} />
        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <h2 className="line-clamp-1 text-base font-semibold text-ink">{title}</h2>
              {profile.name && profile.title ? <p className="mt-1 line-clamp-1 text-sm font-medium text-muted">{profile.title}</p> : null}
            </div>
            <Pill tone="blue">{profile.typeProfile || t("common.profile")}</Pill>
          </div>
          <p className="mt-3 line-clamp-2 text-sm leading-6 text-muted">{summary}</p>
        </div>
      </div>

      {skills.length > 0 ? (
        <div className="mt-4 flex flex-wrap gap-2">
          {skills.map((skill) => (
            <span key={skill} className="rounded-md bg-indigo-50 px-2.5 py-1 text-xs font-semibold text-brand">
              {skill}
            </span>
          ))}
        </div>
      ) : null}

      <div className="mt-4 grid gap-2 sm:grid-cols-2">
        <DetailChip icon={GraduationCap}>{profile.education || t("profile.educationMissing")}</DetailChip>
        <DetailChip icon={Sparkles}>{profile.workExperience || profile.status || t("profile.experienceMissing")}</DetailChip>
        <DetailChip icon={Mail}>{profile.contact?.email || `${t("profiles.userLabel")} #${profile.idUser ?? t("state.unknown")}`}</DetailChip>
        <DetailChip icon={Phone}>{profile.contact?.phone || profile.contact?.address || t("state.phoneNotSet")}</DetailChip>
      </div>
    </PreviewShell>
  );
}

export function CompanyPreviewCard({
  company,
  href,
  surface = "light"
}: {
  company: Company;
  href?: string;
  surface?: Surface;
}) {
  const { t } = useLanguage();
  const title = company.name || t("state.unnamedCompany");
  const jobsCount = company.idJobs?.length ?? 0;
  const hrCount = company.idHR?.length ?? 0;

  return (
    <PreviewShell href={href} surface={surface}>
      <div className="flex items-start gap-4">
        <ImageBadge url={company.url} label={title} icon={Building2} />
        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <h2 className="line-clamp-1 text-base font-semibold text-ink">{title}</h2>
              <p className="mt-1 inline-flex items-center gap-1 text-sm font-medium text-muted">
                <MapPin className="h-3.5 w-3.5 text-brand" />
                {locationText(company, t("state.locationNotSet"))}
              </p>
            </div>
            <Pill tone="orange">{company.type || t("common.company")}</Pill>
          </div>
          <p className="mt-3 line-clamp-3 text-sm leading-6 text-muted">{company.description || t("state.noCompanyDescription")}</p>
        </div>
      </div>

      <div className="mt-4 grid gap-2 sm:grid-cols-2">
        <DetailChip icon={Mail}>{company.email || t("state.emailNotSet")}</DetailChip>
        <DetailChip icon={Phone}>{company.phone || t("state.phoneNotSet")}</DetailChip>
        <DetailChip icon={BriefcaseBusiness}>
          {jobsCount} {t("nav.jobs")}
        </DetailChip>
        <DetailChip icon={UsersRound}>HR {hrCount}</DetailChip>
      </div>
    </PreviewShell>
  );
}

export function JobPreviewCard({
  job,
  company,
  href,
  surface = "light"
}: {
  job: Job;
  company?: Company;
  href?: string;
  surface?: Surface;
}) {
  const { t } = useLanguage();
  const companyName = company?.name || t("state.unknownCompany");
  const acceptedCount = job.idProfile?.length ?? 0;
  const pendingCount = job.idProfiePending?.length ?? 0;

  return (
    <PreviewShell href={href} surface={surface}>
      <div className="flex items-start gap-4">
        <ImageBadge url={company?.url} label={companyName} icon={BriefcaseBusiness} size="medium" />
        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <h2 className="line-clamp-2 text-base font-semibold text-ink">{job.title || t("state.untitledJob")}</h2>
              <p className="mt-1 inline-flex items-center gap-1 text-sm font-medium text-brand">
                <Building2 className="h-3.5 w-3.5" />
                {companyName}
              </p>
            </div>
            <Pill tone="green">{job.typeJob || t("common.job")}</Pill>
          </div>
          <p className="mt-3 line-clamp-3 text-sm leading-6 text-muted">{job.description || t("state.noDescription")}</p>
        </div>
      </div>

      <div className="mt-4 grid gap-2 sm:grid-cols-2">
        <DetailChip icon={MapPin}>{locationText(company, t("state.locationNotSet"))}</DetailChip>
        <DetailChip icon={BriefcaseBusiness}>{t("jobs.openings", { count: job.size ?? 0 })}</DetailChip>
        <DetailChip icon={CheckCircle2}>
          {acceptedCount} {t("jobs.acceptedProfiles")}
        </DetailChip>
        <DetailChip icon={UsersRound}>
          {pendingCount} {t("manager.pendingApplicants")}
        </DetailChip>
      </div>
    </PreviewShell>
  );
}
