"use client";

import { useParams } from "next/navigation";
import { Mail, Phone } from "lucide-react";
import { PageHeader } from "@/components/page-header";
import { EmptyState, ErrorState, LoadingState } from "@/components/data-state";
import { Pill } from "@/components/ui";
import { profileApi, projectApi } from "@/lib/api";
import { useApi } from "@/lib/use-api";

export default function ProfileDetailPage() {
  const params = useParams<{ id: string }>();
  const id = Number(params.id);
  const profile = useApi(() => profileApi.findById(id), [id]);
  const projects = useApi(() => projectApi.byProfile(id), [id]);

  if (profile.loading) {
    return <LoadingState label="Loading profile" />;
  }

  if (profile.error) {
    return <ErrorState message={profile.error} />;
  }

  if (!profile.data) {
    return <EmptyState title="Profile not found" description="This profile may have been removed or is no longer available." />;
  }

  return (
    <div>
      <PageHeader
        eyebrow="Profile"
        title={profile.data.title || profile.data.objective || `Profile #${profile.data.id}`}
        description={profile.data.objective}
      />
      <div className="grid gap-6 lg:grid-cols-[0.75fr_1.25fr]">
        <aside className="rounded-md border border-line bg-white p-5 shadow-soft">
          <Pill tone="blue">{profile.data.typeProfile || "Profile"}</Pill>
          <div className="mt-5 space-y-3 text-sm text-muted">
            <p>{profile.data.education || "Education not provided"}</p>
            <p>{profile.data.workExperience || "Work experience not provided"}</p>
            <p className="font-medium text-ink">{profile.data.skills || "Skills not provided"}</p>
          </div>
          <div className="mt-5 space-y-2 border-t border-line pt-4 text-sm text-muted">
            <p className="flex items-center gap-2">
              <Mail className="h-4 w-4" />
              {profile.data.contact?.email || "Email not set"}
            </p>
            <p className="flex items-center gap-2">
              <Phone className="h-4 w-4" />
              {profile.data.contact?.phone || "Phone not set"}
            </p>
          </div>
        </aside>
        <section>
          <h2 className="mb-3 text-lg font-semibold text-ink">Projects</h2>
          {projects.loading ? <LoadingState /> : null}
          {projects.error ? <ErrorState message={projects.error} /> : null}
          {!projects.loading && projects.data?.length === 0 ? (
            <EmptyState title="No projects" description="Projects connected to this profile will appear here." />
          ) : null}
          <div className="grid gap-4">
            {projects.data?.map((project) => (
              <article key={project.id} className="rounded-md border border-line bg-white p-4 shadow-soft">
                <h3 className="font-semibold text-ink">{project.title}</h3>
                <p className="mt-2 text-sm text-muted">{project.description}</p>
              </article>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}
