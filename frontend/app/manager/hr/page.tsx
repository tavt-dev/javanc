"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Search, UserPlus } from "lucide-react";
import { PageHeader } from "@/components/page-header";
import { EmptyState, ErrorState, LoadingState } from "@/components/data-state";
import { Button, Pill } from "@/components/ui";
import { companyApi } from "@/lib/api";
import { useApi } from "@/lib/use-api";
import type { User } from "@/lib/types";
import { useAuth } from "@/features/auth/auth-provider";
import { useLanguage } from "@/lib/i18n";

export default function ManagerHrPage() {
  const { user } = useAuth();
  const { t } = useLanguage();
  const role = user?.role?.toLowerCase();
  const company = useApi(() => (role === "manager" ? companyApi.myManagedCompany() : Promise.resolve(null)), [role]);
  const [query, setQuery] = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState("");
  const [menuOpen, setMenuOpen] = useState(false);
  const [selected, setSelected] = useState<User | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const searchRef = useRef<HTMLDivElement | null>(null);
  const candidates = useApi(
    () => (company.data?.id && debouncedQuery ? companyApi.hrCandidates(debouncedQuery) : Promise.resolve([])),
    [company.data?.id, debouncedQuery]
  );
  const visibleCandidates = useMemo(() => candidates.data ?? [], [candidates.data]);
  const canSearch = Boolean(company.data?.id);

  useEffect(() => {
    const timeout = window.setTimeout(() => setDebouncedQuery(query.trim()), 250);
    return () => window.clearTimeout(timeout);
  }, [query]);

  useEffect(() => {
    if (!menuOpen) {
      return;
    }

    function onPointerDown(event: PointerEvent) {
      if (!searchRef.current?.contains(event.target as Node)) {
        setMenuOpen(false);
      }
    }

    document.addEventListener("pointerdown", onPointerDown);
    return () => document.removeEventListener("pointerdown", onPointerDown);
  }, [menuOpen]);

  async function requestPromotion() {
    if (!selected?.id) {
      return;
    }
    setSaving(true);
    setError(null);
    setMessage(null);
    try {
      await companyApi.requestHrPromotion(selected.id);
      setMessage(t("manager.hrInvitationSent", { user: selected.name || selected.email || `#${selected.id}` }));
      setSelected(null);
      setQuery("");
      setMenuOpen(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : t("manager.unableRequestHr"));
    } finally {
      setSaving(false);
    }
  }

  if (role === "hr") {
    return <EmptyState title={t("manager.hrManagerOnly")} description={t("manager.hrManagerOnlyDescription")} />;
  }

  return (
    <div className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
      <section>
        <PageHeader eyebrow="HR" title={t("manager.manageHr")} description={t("manager.manageHrDescription")} />
        {company.loading ? <LoadingState /> : null}
        {company.error ? <ErrorState message={company.error} /> : null}
        {!company.loading && !company.data ? <EmptyState title={t("manager.noCompanyAssigned")} description={t("manager.noCompanyAssignedDescription")} /> : null}
        {error ? <ErrorState message={error} /> : null}
        {message ? <div className="mb-4 rounded-md border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-700">{message}</div> : null}
        {company.data ? (
          <div className="mb-5 rounded-md border border-line bg-white p-4 shadow-soft">
            <p className="text-xs font-bold uppercase tracking-wide text-muted">{t("manager.selectedCompany")}</p>
            <div className="mt-2 flex flex-wrap items-center gap-2">
              <h2 className="text-xl font-semibold text-ink">{company.data.name || `Company #${company.data.id}`}</h2>
              <Pill tone="orange">{company.data.type || t("common.company")}</Pill>
              <Pill tone="blue">{company.data.idHR?.length ?? 0} HR</Pill>
            </div>
            <p className="mt-2 text-sm text-muted">{[company.data.city, company.data.country].filter(Boolean).join(", ") || t("state.locationNotSet")}</p>
          </div>
        ) : null}

        <div className="rounded-md border border-line bg-white p-5 shadow-soft">
          <h2 className="text-lg font-semibold text-ink">{t("manager.inviteExistingUser")}</h2>
          <p className="mt-1 text-sm text-muted">{t("manager.inviteHelp")}</p>
          <div className="relative mt-4" ref={searchRef}>
            <div className="flex items-center gap-2 rounded-md border border-line bg-white px-3 shadow-sm focus-within:border-brand">
              <Search className="h-4 w-4 text-muted" />
              <input
                className="h-11 flex-1 border-0 bg-transparent text-sm text-ink outline-none placeholder:text-slate-400"
                value={query}
                disabled={!canSearch}
                onChange={(event) => {
                  setQuery(event.target.value);
                  setSelected(null);
                  setMenuOpen(true);
                }}
                onFocus={() => setMenuOpen(true)}
                placeholder={canSearch ? t("manager.searchHrPlaceholder") : t("manager.searchHrDisabled")}
              />
            </div>
            {!canSearch ? (
              <div className="mt-2 rounded-md border border-yellow-200 bg-yellow-50 px-3 py-3 text-sm font-medium text-warn">
                {t("manager.hrRequiresCompany")}
              </div>
            ) : null}
            {canSearch && menuOpen && query ? (
              <div className="absolute left-0 right-0 top-full z-20 mt-2 max-h-80 overflow-auto rounded-md border border-line bg-white p-2 text-ink shadow-soft">
                {candidates.loading ? <LoadingState label={t("manager.searchingUsers")} /> : null}
                {candidates.error ? (
                  <div className="rounded-md border border-red-100 bg-red-50 px-3 py-3 text-sm font-medium text-danger">
                    {candidates.error}
                  </div>
                ) : null}
                {!candidates.loading && !candidates.error && visibleCandidates.length === 0 ? (
                  <div className="px-3 py-4 text-sm text-muted">{t("manager.noEligibleUsers")}</div>
                ) : null}
                {visibleCandidates.map((user) => (
                  <button
                    key={user.id}
                    type="button"
                    className="pressable flex w-full items-center justify-between gap-3 rounded-md px-3 py-2 text-left hover:bg-canvas"
                    onClick={() => {
                      setSelected(user);
                      setQuery(user.name || user.email || `User #${user.id}`);
                      setMenuOpen(false);
                    }}
                  >
                    <span className="min-w-0">
                      <span className="block truncate text-sm font-semibold">{user.name || `User #${user.id}`}</span>
                      <span className="block truncate text-xs text-muted">{user.email}</span>
                    </span>
                    <Pill tone="neutral">#{user.id}</Pill>
                  </button>
                ))}
              </div>
            ) : null}
          </div>
          {selected ? (
            <div className="mt-4 flex flex-col gap-3 rounded-md bg-canvas p-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="font-semibold text-ink">{selected.name || `User #${selected.id}`}</p>
                <p className="text-sm text-muted">{selected.email}</p>
              </div>
              <Button type="button" onClick={requestPromotion} disabled={saving}>
                <UserPlus className="mr-2 h-4 w-4" />
                {t("manager.requestHrPromotion")}
              </Button>
            </div>
          ) : null}
        </div>
      </section>

      <section>
        <PageHeader eyebrow={t("manager.workflow")} title={t("manager.hrInvitations")} description={t("manager.hrInvitationsDescription")} />
        <div className="grid gap-4 rounded-md border border-line bg-white p-5 text-sm text-muted shadow-soft">
          <p>{t("manager.hrHintSearch")}</p>
          <p>{t("manager.hrHintEligible")}</p>
          <p>{t("manager.hrHintUserConfirm")}</p>
        </div>
      </section>
    </div>
  );
}
