"use client";

import { useEffect, useState } from "react";
import { PencilLine, Plus, Search } from "lucide-react";
import { PageHeader } from "@/components/page-header";
import { EmptyState, ErrorState, LoadingState } from "@/components/data-state";
import { ProfilePreviewCard } from "@/components/item-previews";
import { LinkButton, PaginationControls, inputClass } from "@/components/ui";
import { profileApi, type ListingSort } from "@/lib/api";
import { useApi } from "@/lib/use-api";
import { useLanguage } from "@/lib/i18n";
import { useAuth } from "@/features/auth/auth-provider";

const PAGE_SIZE = 12;

export default function ProfilesPage() {
  const { t } = useLanguage();
  const { signedIn } = useAuth();
  const [query, setQuery] = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState("");
  const [sort, setSort] = useState<ListingSort>("hot");
  const [page, setPage] = useState(0);
  const { data, error, loading } = useApi(
    () => profileApi.list({ title: debouncedQuery || undefined, page, size: PAGE_SIZE, sort }),
    [debouncedQuery, page, sort]
  );
  const myProfile = useApi(() => (signedIn ? profileApi.me().catch(() => null) : Promise.resolve(null)), [signedIn]);
  const profileActionHref = myProfile.data ? "/profile/edit" : "/profile/create";
  const profileActionLabel = myProfile.data ? t("profiles.edit") : t("profiles.create");
  const ProfileActionIcon = myProfile.data ? PencilLine : Plus;

  useEffect(() => {
    const timeoutId = window.setTimeout(() => setDebouncedQuery(query.trim()), 250);
    return () => window.clearTimeout(timeoutId);
  }, [query]);

  useEffect(() => {
    setPage(0);
  }, [debouncedQuery, sort]);

  return (
    <div>
      <PageHeader
        eyebrow={t("profiles.eyebrow")}
        title={t("profiles.title")}
        description={t("profiles.description")}
        actions={
          <LinkButton href={signedIn ? profileActionHref : "/login"}>
            <ProfileActionIcon className="mr-2 h-4 w-4" />
            {signedIn ? profileActionLabel : t("auth.loginButton")}
          </LinkButton>
        }
      />
      <div className="mb-5 grid gap-3 rounded-md border border-line bg-white p-3 shadow-soft md:grid-cols-[1fr_180px]">
        <div className="flex items-center gap-3">
          <Search className="h-4 w-4 text-muted" />
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            className="h-10 flex-1 border-0 bg-transparent text-sm text-ink caret-ink outline-none placeholder:text-slate-400"
            placeholder={t("profiles.searchPlaceholder")}
          />
        </div>
        <select className={inputClass} value={sort} onChange={(event) => setSort(event.target.value as ListingSort)}>
          <option value="hot">Hot first</option>
          <option value="newest">Newest first</option>
        </select>
      </div>
      {loading ? <LoadingState /> : null}
      {error ? <ErrorState message={error} /> : null}
      {!loading && data?.length === 0 ? <EmptyState title={t("profiles.emptyTitle")} description={t("profiles.emptyDescription")} /> : null}
      <div key={`${page}-${sort}-${debouncedQuery}`} className="page-list-enter grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {data?.map((profile) => (
          <ProfilePreviewCard key={profile.id} profile={profile} href={`/profiles/${profile.id}`} fallback={t("state.untitledProfile")} />
        ))}
      </div>
      <PaginationControls page={page} canNext={(data?.length ?? 0) === PAGE_SIZE} onPageChange={setPage} />
    </div>
  );
}
