import { SlidersHorizontal, Users } from "lucide-react";
import { useEffect, useState } from "react";
import { PageTransition } from "@/components/motion/PageTransition";
import { StaggerItem, StaggerList } from "@/components/motion/StaggerList";
import { EmptyState } from "@/components/shared/EmptyState";
import { LoadingSkeleton } from "@/components/shared/LoadingSkeleton";
import { PageHeader } from "@/components/shared/PageHeader";
import { RetryState } from "@/components/shared/RetryState";
import { SearchHeroPanel } from "@/components/shared/SearchHeroPanel";
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
                  onChange={(event) => setType(event.target.value as TypeProfile | "")}
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
        <StaggerList className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {profiles.slice(0, 20).map((profile, index) => (
            <StaggerItem key={profile.id} index={index}>
              <ProfileCard profile={profile} />
            </StaggerItem>
          ))}
        </StaggerList>
      )}
    </PageTransition>
  );
}
