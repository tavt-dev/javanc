import { SlidersHorizontal, Users } from "lucide-react";
import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { PageTransition } from "@/components/motion/PageTransition";
import { StaggerItem, StaggerList } from "@/components/motion/StaggerList";
import { EmptyState } from "@/components/shared/EmptyState";
import { LoadingSkeleton } from "@/components/shared/LoadingSkeleton";
import { PageHeader } from "@/components/shared/PageHeader";
import { PaginationControls } from "@/components/shared/PaginationControls";
import { RetryState } from "@/components/shared/RetryState";
import { SearchHeroPanel } from "@/components/shared/SearchHeroPanel";
import { ProfileCard } from "@/features/profiles/components/ProfileCard";
import { useProfilesSearchQuery } from "@/features/profiles/hooks/use-profile-queries";
import type { TypeProfile } from "@/types/profile";

export function ProfileSearchPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const page = Number(searchParams.get("page") ?? 0);
  const size = Number(searchParams.get("size") ?? 20);
  const sort = searchParams.get("sort") ?? "createdAt,desc";
  const [title, setTitle] = useState(() => searchParams.get("title") ?? "");
  const [debouncedTitle, setDebouncedTitle] = useState(() => searchParams.get("title") ?? "");
  const [type, setType] = useState<TypeProfile | "">(
    () => readProfileType(searchParams.get("type")),
  );

  const updateListParams = (next: Record<string, string | undefined>) => {
    const updated = new URLSearchParams(searchParams);
    Object.entries(next).forEach(([key, value]) => {
      if (!value) updated.delete(key);
      else updated.set(key, value);
    });
    setSearchParams(updated, { replace: true });
  };

  useEffect(() => {
    const timeout = window.setTimeout(() => {
      const trimmedTitle = title.trim();
      setDebouncedTitle(trimmedTitle);
      updateListParams({ title: trimmedTitle || undefined, page: "0" });
    }, 300);
    return () => window.clearTimeout(timeout);
    // updateListParams intentionally depends on searchParams and would reset the debounce on every URL update.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [title]);

  const query = useProfilesSearchQuery({
    title: debouncedTitle || undefined,
    type: type || undefined,
    page,
    size,
    sort,
  });
  const profiles = query.data?.items ?? [];

  return (
    <PageTransition>
      <PageHeader
        variant="hero"
        eyebrow="Talent discovery"
        title="Profiles"
        description="Search active professional profiles by title and profile type."
        search={
          <SearchHeroPanel
            value={title}
            onChange={setTitle}
            placeholder="Search profiles by title, skill, or focus area"
            filters={
              <>
                <select
                  value={type}
                  onChange={(event) => {
                    const nextType = event.target.value as TypeProfile | "";
                    setType(nextType);
                    updateListParams({ type: nextType || undefined, page: "0" });
                  }}
                  className="form-input md:w-44"
                >
                  <option value="">All types</option>
                  <option value="JAVA">Java</option>
                  <option value="PYTHON">Python</option>
                  <option value="C">C</option>
                </select>
                <button
                  type="button"
                  onClick={() => {
                    setTitle("");
                    setDebouncedTitle("");
                    setType("");
                    updateListParams({ title: undefined, type: undefined, page: "0" });
                  }}
                  className="btn-secondary focus-ring h-10 bg-card"
                >
                  <SlidersHorizontal size={16} />
                  Clear
                </button>
              </>
            }
          />
        }
      />

      {query.isLoading ? (
        <LoadingSkeleton variant="search" />
      ) : query.error ? (
        <RetryState error={query.error} onRetry={query.refetch} />
      ) : profiles.length === 0 ? (
        <EmptyState
          icon={Users}
          title="No profiles found"
          description="Try a broader title search or clear the profile type filter."
        />
      ) : (
        <div className="space-y-4">
          <StaggerList className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {profiles.map((profile, index) => (
              <StaggerItem key={profile.id} index={index}>
                <ProfileCard profile={profile} />
              </StaggerItem>
            ))}
          </StaggerList>
          {query.data && (
            <PaginationControls
              page={query.data}
              onPageChange={(nextPage) => updateListParams({ page: String(nextPage) })}
              onSizeChange={(nextSize) =>
                updateListParams({ size: String(nextSize), page: "0" })
              }
            />
          )}
        </div>
      )}
    </PageTransition>
  );
}

function readProfileType(value: string | null): TypeProfile | "" {
  return value === "JAVA" || value === "PYTHON" || value === "C" ? value : "";
}
