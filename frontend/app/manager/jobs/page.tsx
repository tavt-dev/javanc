"use client";

import { useEffect, useState } from "react";
import { PageHeader } from "@/components/page-header";
import { EmptyState, ErrorState, LoadingState } from "@/components/data-state";
import { Button, PaginationControls, Pill, inputClass } from "@/components/ui";
import { JobForm } from "@/features/jobs/job-form";
import { companyApi, jobApi, profileApi, type ListingSort } from "@/lib/api";
import { useApi } from "@/lib/use-api";
import type { Company, Job, Profile } from "@/lib/types";
import { useAuth } from "@/features/auth/auth-provider";
import { useLanguage } from "@/lib/i18n";

const PAGE_SIZE = 10;

export default function ManagerJobsPage() {
  const { user } = useAuth();
  const { t } = useLanguage();
  const role = user?.role?.toLowerCase();
  const [sort, setSort] = useState<ListingSort>("newest");
  const [page, setPage] = useState(0);
  const companies = useApi(
    () => (role === "hr" && user?.id ? companyApi.byHr(user.id).then((company) => [company]) : companyApi.list({ page: 0, size: 100, sort: "hot" })),
    [role, user?.id]
  );
  const managedCompanyId = companies.data?.[0]?.id;
  const { data, error, loading } = useApi(
    () =>
      role === "hr"
        ? managedCompanyId
          ? jobApi.byCompany(managedCompanyId, { page, size: PAGE_SIZE, sort })
          : Promise.resolve([])
        : jobApi.list({ page, size: PAGE_SIZE, sort }),
    [role, managedCompanyId, page, sort]
  );
  const [created, setCreated] = useState<Job[]>([]);
  const [updated, setUpdated] = useState<Record<number, Job>>({});
  const [working, setWorking] = useState<number | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const companyById = new Map((companies.data ?? []).map((company) => [company.id, company]));
  const allowedCompanyIds = new Set((companies.data ?? []).map((company) => company.id));
  const allJobs = [...created, ...(data ?? [])].map((job) => (job.id ? updated[job.id] ?? job : job));
  const jobs = role === "hr" ? allJobs.filter((job) => allowedCompanyIds.has(job.idCompany)) : allJobs;

  useEffect(() => {
    setPage(0);
  }, [sort]);

  async function deleteJob(id?: number) {
    if (!id) {
      return;
    }
    setWorking(id);
    setActionError(null);
    try {
      await jobApi.delete(id);
      setCreated((items) => items.filter((job) => job.id !== id));
      setUpdated((items) => {
        const next = { ...items };
        delete next[id];
        return next;
      });
    } catch (err) {
      setActionError(err instanceof Error ? err.message : t("jobs.unableSave"));
    } finally {
      setWorking(null);
    }
  }

  async function reviewApplication(jobId: number | undefined, profileId: number, decision: "accept" | "reject") {
    if (!jobId) {
      return;
    }
    setWorking(jobId);
    setActionError(null);
    try {
      const saved = decision === "accept" ? await jobApi.accept(jobId, profileId) : await jobApi.reject(jobId, profileId);
      setUpdated((items) => ({ ...items, [jobId]: saved }));
    } catch (err) {
      setActionError(err instanceof Error ? err.message : t("jobs.unableApply"));
    } finally {
      setWorking(null);
    }
  }

  return (
    <div className="grid gap-6 xl:grid-cols-[0.85fr_1.15fr]">
      <section>
        <PageHeader eyebrow="HR" title={t("jobs.createTitle")} description={t("jobs.createDescription")} />
        {companies.error ? <ErrorState message={companies.error} /> : null}
        {companies.loading ? <LoadingState label={t("state.loading")} /> : null}
        <JobForm companies={companies.data ?? []} onSaved={(job) => setCreated((items) => [job, ...items])} />
      </section>
      <section>
        <PageHeader eyebrow={t("nav.manager")} title={t("manager.jobBoard")} description={t("manager.jobBoardDescription")} />
        <div className="mb-5 flex justify-end">
          <select className={`${inputClass} max-w-48`} value={sort} onChange={(event) => setSort(event.target.value as ListingSort)}>
            <option value="newest">Newest first</option>
            <option value="hot">Hot first</option>
          </select>
        </div>
        {loading ? <LoadingState /> : null}
        {error ? <ErrorState message={error} /> : null}
        {actionError ? <ErrorState message={actionError} /> : null}
        {!loading && jobs.length === 0 ? <EmptyState title={t("manager.noJobs")} description={t("manager.noJobsDescription")} /> : null}
        <div key={`${page}-${sort}-${role ?? ""}-${managedCompanyId ?? ""}`} className="page-list-enter grid gap-4">
          {jobs.map((job, index) => (
            <JobCard
              key={`${job.id ?? "new"}-${index}`}
              job={job}
              company={companyById.get(job.idCompany)}
              disabled={working === job.id}
              onDelete={deleteJob}
              onReview={reviewApplication}
            />
          ))}
        </div>
        <PaginationControls page={page} canNext={(data?.length ?? 0) === PAGE_SIZE} onPageChange={setPage} />
      </section>
    </div>
  );
}

function JobCard({
  job,
  company,
  disabled,
  onDelete,
  onReview
}: {
  job: Job;
  company?: Company;
  disabled: boolean;
  onDelete: (id?: number) => void;
  onReview: (jobId: number | undefined, profileId: number, decision: "accept" | "reject") => void;
}) {
  const { t } = useLanguage();
  return (
    <article className="glass-panel scroll-reveal rounded-md p-5">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h2 className="font-semibold text-ink">{job.title || t("state.untitledJob")}</h2>
                  <p className="mt-1 text-sm font-medium text-brand">{company?.name || t("state.unknownCompany")}</p>
                  <p className="mt-2 text-sm text-muted">{job.description || t("state.noDescription")}</p>
                </div>
                <Pill tone="green">{job.typeJob || t("common.job")}</Pill>
              </div>
              <div className="mt-4 flex items-center justify-between gap-3 text-sm text-muted">
                <span>{[company?.city, company?.country].filter(Boolean).join(", ") || t("state.locationNotSet")}</span>
                <Button type="button" variant="danger" onClick={() => onDelete(job.id)} disabled={disabled}>
                  {t("common.delete")}
                </Button>
              </div>
              <PendingApplicants job={job} disabled={disabled} onReview={onReview} />
            </article>
  );
}

function PendingApplicants({
  job,
  disabled,
  onReview
}: {
  job: Job;
  disabled: boolean;
  onReview: (jobId: number | undefined, profileId: number, decision: "accept" | "reject") => void;
}) {
  const { t } = useLanguage();
  const pendingIds = job.idProfiePending ?? [];
  const profiles = useApi(() => (pendingIds.length ? profileApi.pendingJobProfiles(pendingIds) : Promise.resolve([])), [pendingIds.join(",")]);

  if (!pendingIds.length) {
    return null;
  }

  return (
    <div className="mt-4 rounded-md border border-line bg-canvas p-4">
      <h3 className="text-sm font-semibold text-ink">{t("manager.pendingApplicants")}</h3>
      {profiles.loading ? <LoadingState label={t("state.loading")} /> : null}
      {profiles.error ? <ErrorState message={profiles.error} /> : null}
      <div className="mt-3 grid gap-3">
        {(profiles.data ?? pendingIds.map((id) => ({ id }) as Profile)).map((profile) => (
          <div key={profile.id} className="flex items-center justify-between gap-3 rounded-md border border-line bg-canvas px-3 py-2 text-sm">
            <div>
              <p className="font-medium text-ink">{profile.name || profile.title || `Profile #${profile.id}`}</p>
              <p className="text-muted">{profile.title || t("jobs.application")}</p>
            </div>
            <div className="flex gap-2">
              <Button type="button" variant="secondary" onClick={() => onReview(job.id, Number(profile.id), "reject")} disabled={disabled}>
                {t("notifications.reject")}
              </Button>
              <Button type="button" onClick={() => onReview(job.id, Number(profile.id), "accept")} disabled={disabled}>
                {t("notifications.accept")}
              </Button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
