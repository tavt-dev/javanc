import { ArrowLeft, FileText, Pencil } from "lucide-react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { PageTransition } from "@/components/motion/PageTransition";
import { EmptyState } from "@/components/shared/EmptyState";
import { LoadingSkeleton } from "@/components/shared/LoadingSkeleton";
import { PageHeader } from "@/components/shared/PageHeader";
import { RetryState } from "@/components/shared/RetryState";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { ProjectCard } from "@/features/projects/components/ProjectCard";
import { useProjectsByProfileQuery } from "@/features/projects/hooks/use-project-queries";
import { useProfileDetailQuery } from "@/features/profiles/hooks/use-profile-queries";
import { useAuthStore } from "@/stores/auth-store";

export function ProfileDetailPage() {
  const params = useParams();
  const navigate = useNavigate();
  const user = useAuthStore((s) => s.user);
  const id = params.id ? Number(params.id) : null;
  const validId = id && Number.isFinite(id) && id > 0 ? id : null;
  const profileQuery = useProfileDetailQuery(validId);
  const profile = profileQuery.data;
  const isOwner = Boolean(profile && user?.id === profile.idUser);
  const projectsQuery = useProjectsByProfileQuery(profile?.id);
  const visibleProjects = (projectsQuery.data ?? []).filter(
    (project) => isOwner || project.display,
  );

  if (!validId) {
    return (
      <PageTransition>
        <EmptyState
          icon={FileText}
          title="Invalid profile"
          description="The profile link is not valid."
          action={
            <button
              type="button"
              onClick={() => navigate("/profiles")}
              className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground"
            >
              Back to profiles
            </button>
          }
        />
      </PageTransition>
    );
  }

  if (profileQuery.isLoading) {
    return (
      <PageTransition>
        <PageHeader title="Profile detail" description="Loading profile." />
        <LoadingSkeleton variant="detail" />
      </PageTransition>
    );
  }

  if (profileQuery.error || !profile) {
    return (
      <PageTransition>
        <PageHeader title="Profile detail" description="View profile details." />
        <RetryState error={profileQuery.error} onRetry={profileQuery.refetch} />
      </PageTransition>
    );
  }

  return (
    <PageTransition>
      <PageHeader
        title={profile.title || "Untitled profile"}
        description="Read-only professional profile details."
        actions={
          <>
            <button
              type="button"
              onClick={() => navigate("/profiles")}
              className="inline-flex items-center gap-2 rounded-md border border-border px-4 py-2 text-sm font-medium transition-colors hover:bg-accent"
            >
              <ArrowLeft size={16} />
              Back
            </button>
            {isOwner && (
              <Link
                to="/profile"
                className="inline-flex items-center gap-2 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
              >
                <Pencil size={16} />
                Edit my profile
              </Link>
            )}
          </>
        }
      />

      <section className="rounded-lg border border-border bg-card p-5 shadow-sm">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
          <div className="flex h-20 w-20 items-center justify-center overflow-hidden rounded-lg bg-primary/10 text-xl font-semibold text-primary">
            {profile.url ? (
              <img
                src={profile.url}
                alt={`${profile.title || "Profile"} avatar`}
                className="h-full w-full object-cover"
              />
            ) : (
              "P"
            )}
          </div>
          <div className="min-w-0">
            <h2 className="text-xl font-semibold">{profile.title}</h2>
            <div className="mt-2 flex flex-wrap gap-2">
              {profile.typeProfile && (
                <StatusBadge tone="primary">{profile.typeProfile}</StatusBadge>
              )}
              {profile.status && (
                <StatusBadge tone="success">{profile.status}</StatusBadge>
              )}
            </div>
          </div>
        </div>
      </section>

      <div className="grid gap-4 lg:grid-cols-2">
        <DetailSection title="Objective" value={profile.objective} />
        <DetailSection title="Skills" value={profile.skills} />
        <DetailSection title="Education" value={profile.education} />
        <DetailSection
          title="Work experience"
          value={profile.workExperience}
        />
      </div>

      <section className="rounded-lg border border-border bg-card p-5 shadow-sm">
        <h2 className="text-lg font-semibold">Projects</h2>
        {projectsQuery.isLoading ? (
          <div className="mt-4">
            <LoadingSkeleton variant="cardGrid" />
          </div>
        ) : visibleProjects.length === 0 ? (
          <div className="mt-4">
            <EmptyState
              icon={FileText}
              title="No visible projects"
              description="This profile does not have public projects yet."
            />
          </div>
        ) : (
          <div className="mt-4 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {visibleProjects.map((project) => (
              <ProjectCard key={project.id} project={project} />
            ))}
          </div>
        )}
      </section>
    </PageTransition>
  );
}

function DetailSection({ title, value }: { title: string; value?: string }) {
  return (
    <section className="rounded-lg border border-border bg-card p-5 shadow-sm">
      <h2 className="text-base font-semibold">{title}</h2>
      <p className="mt-3 whitespace-pre-wrap text-sm leading-6 text-muted-foreground">
        {value || "Not provided."}
      </p>
    </section>
  );
}
