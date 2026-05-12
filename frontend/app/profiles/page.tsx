"use client";

import Link from "next/link";
import { Plus, Search } from "lucide-react";
import { PageHeader } from "@/components/page-header";
import { EmptyState, ErrorState, LoadingState } from "@/components/data-state";
import { LinkButton, Pill } from "@/components/ui";
import { profileApi } from "@/lib/api";
import { useApi } from "@/lib/use-api";
import { useLanguage } from "@/lib/i18n";

export default function ProfilesPage() {
  const { t } = useLanguage();
  const { data, error, loading } = useApi(() => profileApi.list(), []);

  return (
    <div>
      <PageHeader
        eyebrow={t("profiles.eyebrow")}
        title={t("profiles.title")}
        description={t("profiles.description")}
        actions={
          <LinkButton href="/profile/create">
            <Plus className="mr-2 h-4 w-4" />
            {t("profiles.create")}
          </LinkButton>
        }
      />
      <div className="mb-5 flex items-center gap-3 rounded-md border border-line bg-white p-3">
        <Search className="h-4 w-4 text-muted" />
        <input className="focus-ring flex-1 border-0 bg-transparent text-sm outline-none" placeholder={t("profiles.searchPlaceholder")} />
      </div>
      {loading ? <LoadingState /> : null}
      {error ? <ErrorState message={error} /> : null}
      {!loading && data?.length === 0 ? <EmptyState title={t("profiles.emptyTitle")} description={t("profiles.emptyDescription")} /> : null}
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {data?.map((profile) => (
          <Link key={profile.id} href={`/profiles/${profile.id}`} className="rounded-md border border-line bg-white p-5 shadow-soft hover:border-brand">
            <div className="flex items-start justify-between gap-3">
              <div>
                <h2 className="text-base font-semibold text-ink">{profile.title || profile.objective || t("state.untitledProfile")}</h2>
                <p className="mt-1 text-sm text-muted">{t("profiles.userLabel")} #{profile.idUser ?? t("state.unknown")}</p>
              </div>
              <Pill tone="blue">{profile.typeProfile || "Profile"}</Pill>
            </div>
            <p className="mt-4 line-clamp-2 text-sm leading-6 text-muted">{profile.skills || profile.education || t("state.noSummary")}</p>
          </Link>
        ))}
      </div>
    </div>
  );
}
