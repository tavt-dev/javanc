import { Search, SlidersHorizontal, Users } from "lucide-react";
import { useEffect, useState } from "react";
import { PageTransition } from "@/components/motion/PageTransition";
import { StaggerItem, StaggerList } from "@/components/motion/StaggerList";
import { EmptyState } from "@/components/shared/EmptyState";
import { LoadingSkeleton } from "@/components/shared/LoadingSkeleton";
import { PageHeader } from "@/components/shared/PageHeader";
import { RetryState } from "@/components/shared/RetryState";
import { ProfileCard } from "@/features/profiles/components/ProfileCard";
import { useProfilesSearchQuery } from "@/features/profiles/hooks/use-profile-queries";
import type { TypeProfile } from "@/types/profile";

export function ProfileSearchPage() {
  const [title, setTitle] = useState("");
  const [debouncedTitle, setDebouncedTitle] = useState("");
  const [type, setType] = useState<TypeProfile | "">("");

  useEffect(() => {
    const timeout = window.setTimeout(() => setDebouncedTitle(title), 300);
    return () => window.clearTimeout(timeout);
  }, [title]);

  const query = useProfilesSearchQuery({
    title: debouncedTitle || undefined,
    type: type || undefined,
    page: 0,
    size: 20,
  });
  const profiles = query.data ?? [];

  return (
    <PageTransition>
      <PageHeader
        title="Profiles"
        description="Search active professional profiles by title and profile type."
      />

      <div className="rounded-lg border border-border bg-card p-4 shadow-sm">
        <div className="grid gap-3 md:grid-cols-[1fr_180px_auto]">
          <label className="relative block">
            <Search
              size={16}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
            />
            <input
              value={title}
              onChange={(event) => setTitle(event.target.value)}
              placeholder="Search by title"
              className="w-full rounded-md border border-input bg-background py-2 pl-9 pr-3 text-sm outline-none transition-colors focus:border-ring focus:ring-2 focus:ring-ring/20"
            />
          </label>
          <select
            value={type}
            onChange={(event) => setType(event.target.value as TypeProfile | "")}
            className="rounded-md border border-input bg-background px-3 py-2 text-sm outline-none transition-colors focus:border-ring focus:ring-2 focus:ring-ring/20"
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
            }}
            className="inline-flex items-center justify-center gap-2 rounded-md border border-border px-4 py-2 text-sm font-medium transition-colors hover:bg-accent"
          >
            <SlidersHorizontal size={16} />
            Clear
          </button>
        </div>
      </div>

      {query.isLoading ? (
        <LoadingSkeleton variant="cardGrid" />
      ) : query.error ? (
        <RetryState error={query.error} onRetry={query.refetch} />
      ) : profiles.length === 0 ? (
        <EmptyState
          icon={Users}
          title="No profiles found"
          description="Try a broader title search or clear the profile type filter."
        />
      ) : (
        <StaggerList className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {profiles.slice(0, 20).map((profile) => (
            <StaggerItem key={profile.id}>
              <ProfileCard profile={profile} />
            </StaggerItem>
          ))}
        </StaggerList>
      )}
    </PageTransition>
  );
}
