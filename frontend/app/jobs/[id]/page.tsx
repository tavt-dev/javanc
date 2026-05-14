"use client";

import { useState } from "react";
import { useParams } from "next/navigation";
import { PageHeader } from "@/components/page-header";
import { EmptyState, ErrorState, LoadingState } from "@/components/data-state";
import { Button, Pill } from "@/components/ui";
import { companyApi, jobApi, profileApi } from "@/lib/api";
import { useApi } from "@/lib/use-api";
import { useAuth } from "@/features/auth/auth-provider";
import { useLanguage } from "@/lib/i18n";

export default function JobDetailPage() {
  const params = useParams<{ id: string }>();
  const id = Number(params.id);
  const { signedIn, user } = useAuth();
  const { t } = useLanguage();
  const role = user?.role?.toLowerCase();
  const canApply = role === "user";
  const [statusVersion, setStatusVersion] = useState(0);
  const job = useApi(() => jobApi.byId(id), [id]);
  const company = useApi(
    () => (job.data?.idCompany ? companyApi.byId(job.data.idCompany).catch(() => null) : Promise.resolve(null)),
    [job.data?.idCompany]
  );
  const profile = useApi(() => (signedIn && canApply ? profileApi.me().catch(() => null) : Promise.resolve(null)), [signedIn, canApply]);
  const status = useApi(() => (signedIn && canApply ? jobApi.applicationStatus(id).catch(() => "NONE") : Promise.resolve("NONE")), [id, signedIn, canApply, statusVersion]);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [working, setWorking] = useState(false);

  async function apply() {
    if (!profile.data?.id) {
      setError(t("jobs.createProfileBeforeApply"));
      return;
    }
    setMessage(null);
    setError(null);
    setWorking(true);
    try {
      await jobApi.applyMine(id);
      setMessage(t("jobs.applicationSent"));
      setStatusVersion((current) => current + 1);
    } catch (err) {
      setError(err instanceof Error ? err.message : t("jobs.unableApply"));
    } finally {
      setWorking(false);
    }
  }

  async function leaveJob() {
    setMessage(null);
    setError(null);
    setWorking(true);
    try {
      await jobApi.leaveMine(id);
      setMessage(t("jobs.leftApplication"));
      setStatusVersion((current) => current + 1);
    } catch (err) {
      setError(err instanceof Error ? err.message : t("jobs.unableLeave"));
    } finally {
      setWorking(false);
    }
  }

  if (job.loading) {
    return <LoadingState label={t("jobs.loadingJob")} />;
  }

  if (job.error) {
    return <ErrorState message={job.error} />;
  }

  if (!job.data) {
    return <EmptyState title={t("jobs.notFound")} description={t("jobs.notFoundDescription")} />;
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
      <section>
        <PageHeader
          eyebrow={t("jobs.detailEyebrow")}
          title={job.data.title || `Job #${job.data.id}`}
          description={job.data.description}
          breadcrumbs={[{ label: t("nav.jobs"), href: "/jobs" }, { label: job.data.title || `Job #${job.data.id}` }]}
        />
        <div className="rounded-md border border-line bg-white p-5 shadow-soft">
          <Pill tone="green">{job.data.typeJob || t("common.job")}</Pill>
          <dl className="mt-5 grid gap-4 text-sm sm:grid-cols-3">
            <div>
              <dt className="font-semibold text-ink">{t("jobs.company")}</dt>
              <dd className="mt-1 text-muted">
                {company.loading ? t("common.loading") : company.data?.name || t("state.unknownCompany")}
              </dd>
            </div>
            <div>
              <dt className="font-semibold text-ink">{t("jobs.teamSize")}</dt>
              <dd className="mt-1 text-muted">{job.data.size ?? t("common.notSet")}</dd>
            </div>
            <div>
              <dt className="font-semibold text-ink">{t("jobs.acceptedProfiles")}</dt>
              <dd className="mt-1 text-muted">{job.data.idProfile?.length ?? 0}</dd>
            </div>
          </dl>
        </div>
      </section>
      <aside className="rounded-md border border-line bg-white p-5 shadow-soft">
        <h2 className="text-lg font-semibold text-ink">{t("jobs.application")}</h2>
        <p className="mt-1 text-sm text-muted">{t("jobs.applicationHelp")}</p>
        <div className="mt-4 space-y-4">
          {error ? <ErrorState message={error} /> : null}
          {message ? <div className="rounded-md border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">{message}</div> : null}
          {!canApply ? <EmptyState title={t("jobs.userRequired")} description={t("jobs.userRequiredDescription")} /> : null}
          {canApply && profile.loading ? <LoadingState label={t("jobs.checkingProfile")} /> : null}
          {canApply && !profile.loading && !profile.data ? <EmptyState title={t("jobs.noProfile")} description={t("jobs.noProfileDescription")} /> : null}
          {canApply && profile.data ? <p className="text-sm text-muted">{t("jobs.applyingAs", { profile: profile.data.name || profile.data.title || `Profile #${profile.data.id}` })}</p> : null}
          {canApply && status.data && status.data !== "NONE" ? (
            <Pill tone={status.data === "ACCEPTED" ? "green" : "blue"}>{status.data}</Pill>
          ) : null}
          {canApply && status.data === "NONE" ? (
            <Button type="button" onClick={apply} disabled={!profile.data?.id || working}>
              {t("jobs.apply")}
            </Button>
          ) : null}
          {canApply && (status.data === "PENDING" || status.data === "ACCEPTED") ? (
            <Button type="button" variant="secondary" onClick={leaveJob} disabled={working}>
              {t("jobs.leave")}
            </Button>
          ) : null}
        </div>
      </aside>
    </div>
  );
}
