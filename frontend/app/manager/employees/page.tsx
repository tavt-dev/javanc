"use client";

import { useEffect, useMemo, useState } from "react";
import { PageHeader } from "@/components/page-header";
import { EmptyState, ErrorState, LoadingState } from "@/components/data-state";
import { Button, PaginationControls, Pill } from "@/components/ui";
import { companyApi, jobApi, profileApi } from "@/lib/api";
import { useApi } from "@/lib/use-api";
import { useLanguage } from "@/lib/i18n";
import type { Profile } from "@/lib/types";
import { useAuth } from "@/features/auth/auth-provider";

const PAGE_SIZE = 8;

export default function ManagerEmployeesPage() {
  const { t } = useLanguage();
  const { user } = useAuth();
  const role = user?.role?.toLowerCase();
  const company = useApi(
    () => {
      if (!user?.id) {
        return Promise.resolve(null);
      }
      return role === "hr" ? companyApi.byHr(user.id).catch(() => null) : companyApi.myManagedCompany().catch(() => companyApi.byManager(user.id).catch(() => null));
    },
    [role, user?.id]
  );
  const jobs = useApi(() => (company.data?.id ? jobApi.byCompany(company.data.id) : Promise.resolve([])), [company.data?.id]);
  const acceptedProfileIds = useMemo(
    () => Array.from(new Set((jobs.data ?? []).flatMap((job) => job.idProfile ?? []).filter((id): id is number => Boolean(id)))),
    [jobs.data]
  );
  const acceptedProfileKey = acceptedProfileIds.join(",");
  const profiles = useApi(
    () => (acceptedProfileIds.length ? profileApi.pendingJobProfiles(acceptedProfileIds) : Promise.resolve([])),
    [acceptedProfileKey]
  );
  const employees = useMemo(
    () => (profiles.data ?? []).filter((profile) => acceptedProfileIds.includes(Number(profile.id))),
    [acceptedProfileIds, profiles.data]
  );
  const [working, setWorking] = useState<number | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [page, setPage] = useState(0);
  const pagedEmployees = employees.slice(page * PAGE_SIZE, page * PAGE_SIZE + PAGE_SIZE);

  useEffect(() => {
    setPage(0);
  }, [acceptedProfileKey]);

  async function promoteToHr(profile: Profile) {
    if (!profile.idUser) {
      return;
    }
    setWorking(profile.idUser);
    setActionError(null);
    setMessage(null);
    try {
      if (!company.data?.id) {
        throw new Error(t("manager.noCompanyAssignedError"));
      }
      await companyApi.requestHrPromotion(profile.idUser);
      setMessage(t("manager.hrInviteSentLong"));
    } catch (err) {
      setActionError(err instanceof Error ? err.message : t("manager.unableInviteEmployeeHr"));
    } finally {
      setWorking(null);
    }
  }

  return (
    <div>
      <PageHeader eyebrow={t("manager.peopleEyebrow")} title={t("manager.employeesTitle")} description={t("manager.employeesCompanyDescription")} />
      {company.loading || jobs.loading || profiles.loading ? <LoadingState /> : null}
      {company.error ? <ErrorState message={company.error} /> : null}
      {jobs.error ? <ErrorState message={jobs.error} /> : null}
      {profiles.error ? <ErrorState message={profiles.error} /> : null}
      {actionError ? <ErrorState message={actionError} /> : null}
      {message ? <div className="mb-6 rounded-md border border-emerald-300/40 bg-emerald-400/10 px-4 py-3 text-sm font-medium text-emerald-100">{message}</div> : null}
      {!company.loading && !company.data ? <EmptyState title={t("manager.noCompanyAssigned")} description={t("manager.noCompanyForEmployees")} /> : null}
      {!company.loading && !jobs.loading && !profiles.loading && company.data && employees.length === 0 ? (
        <EmptyState title={t("manager.noEmployees")} description={t("manager.noEmployeesJoined")} />
      ) : null}
      <div key={`${page}-${acceptedProfileKey}`} className="page-list-enter grid gap-4 md:grid-cols-2">
        {pagedEmployees.map((profile) => (
          <article key={profile.id} className="glass-panel scroll-reveal rounded-md p-5">
            <div className="flex items-start justify-between gap-3">
              <div>
                <h2 className="font-semibold text-ink">{profile.name || profile.title || t("state.unknown")}</h2>
                <p className="mt-1 text-sm text-muted">{profile.title || profile.typeProfile || t("manager.acceptedEmployee")}</p>
                <p className="mt-2 text-sm text-muted">{profile.contact?.email || `User #${profile.idUser ?? "unknown"}`}</p>
              </div>
              <div className="flex flex-col items-end gap-3">
                <Pill tone="green">{t("manager.employee")}</Pill>
                {role === "manager" ? (
                  <Button type="button" variant="secondary" onClick={() => promoteToHr(profile)} disabled={working === profile.idUser || company.loading || !company.data?.id || !profile.idUser}>
                    {t("manager.promoteToHr")}
                  </Button>
                ) : null}
              </div>
            </div>
          </article>
        ))}
      </div>
      <PaginationControls page={page} canNext={(page + 1) * PAGE_SIZE < employees.length} onPageChange={setPage} />
    </div>
  );
}
