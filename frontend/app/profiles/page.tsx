"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { PencilLine, Plus, Search } from "lucide-react";
import { PageHeader } from "@/components/page-header";
import { EmptyState, ErrorState, LoadingState } from "@/components/data-state";
import { Protected } from "@/components/protected";
import { LinkButton, Pill } from "@/components/ui";
import { imageApi, profileApi } from "@/lib/api";
import { useApi } from "@/lib/use-api";
import { useLanguage } from "@/lib/i18n";
import { useAuth } from "@/features/auth/auth-provider";
import type { Profile } from "@/lib/types";

export default function ProfilesPage() {
  const { t } = useLanguage();
  const { signedIn } = useAuth();
  const [query, setQuery] = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState("");
  const { data, error, loading } = useApi(
    () => (signedIn ? profileApi.list({ title: debouncedQuery || undefined }) : Promise.resolve([])),
    [signedIn, debouncedQuery]
  );
  const myProfile = useApi(() => (signedIn ? profileApi.me().catch(() => null) : Promise.resolve(null)), [signedIn]);
  const profileActionHref = myProfile.data ? "/profile/edit" : "/profile/create";
  const profileActionLabel = myProfile.data ? "Edit profile" : t("profiles.create");
  const ProfileActionIcon = myProfile.data ? PencilLine : Plus;

  useEffect(() => {
    const timeoutId = window.setTimeout(() => setDebouncedQuery(query.trim()), 250);
    return () => window.clearTimeout(timeoutId);
  }, [query]);

  return (
    <Protected>
      <PageHeader
        eyebrow={t("profiles.eyebrow")}
        title={t("profiles.title")}
        description={t("profiles.description")}
        actions={
          <LinkButton href={profileActionHref}>
            <ProfileActionIcon className="mr-2 h-4 w-4" />
            {profileActionLabel}
          </LinkButton>
        }
      />
      <div className="mb-5 flex min-h-14 items-center gap-3 rounded-[28px] border border-white/10 bg-white px-5 shadow-soft">
        <Search className="h-4 w-4 text-muted" />
        <input
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          className="flex-1 border-0 bg-transparent text-sm text-ink caret-ink outline-none placeholder:text-slate-400 [color-scheme:light] focus:ring-0"
          placeholder={t("profiles.searchPlaceholder")}
        />
      </div>
      {loading ? <LoadingState /> : null}
      {error ? <ErrorState message={error} /> : null}
      {!loading && data?.length === 0 ? <EmptyState title={t("profiles.emptyTitle")} description={t("profiles.emptyDescription")} /> : null}
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {data?.map((profile) => (
          <Link key={profile.id} href={`/profiles/${profile.id}`} className="interactive-card scroll-reveal rounded-md border border-line bg-white p-5 shadow-soft hover:border-brand">
            <div className="flex items-start gap-4">
              <ProfileThumbnail profile={profile} fallback={t("state.untitledProfile")} />
              <div className="min-w-0 flex-1">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <h2 className="truncate text-base font-semibold text-ink">{profile.name || profile.title || profile.objective || t("state.untitledProfile")}</h2>
                    {profile.name && profile.title ? <p className="mt-1 truncate text-sm font-medium text-muted">{profile.title}</p> : null}
                    <p className="mt-1 text-sm text-muted">{t("profiles.userLabel")} #{profile.idUser ?? t("state.unknown")}</p>
                  </div>
                  <Pill tone="blue">{profile.typeProfile || "Profile"}</Pill>
                </div>
                <p className="mt-4 line-clamp-2 text-sm leading-6 text-muted">{profile.skills || profile.education || t("state.noSummary")}</p>
              </div>
            </div>
          </Link>
        ))}
      </div>
    </Protected>
  );
}

function ProfileThumbnail({ profile, fallback }: { profile: Profile; fallback: string }) {
  const preview = useApi(
    () => (profile.url ? imageApi.previewUrl(profile.url, 96).catch(() => profile.url ?? null) : Promise.resolve(null)),
    [profile.url]
  );
  const label = (profile.name || profile.title || fallback).trim().charAt(0).toUpperCase();

  return (
    <div className="flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden rounded-md border border-line bg-slate-100 text-lg font-semibold text-brand">
      {preview.data ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={preview.data} alt={profile.name || profile.title || fallback} className="h-full w-full object-cover" />
      ) : (
        <span>{label || "P"}</span>
      )}
    </div>
  );
}
