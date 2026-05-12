"use client";

import { useState } from "react";
import { PageHeader } from "@/components/page-header";
import { EmptyState, ErrorState, LoadingState } from "@/components/data-state";
import { ProjectForm } from "@/features/projects/project-form";
import { projectApi } from "@/lib/api";
import { useApi } from "@/lib/use-api";
import type { Project } from "@/lib/types";
import { useLanguage } from "@/lib/i18n";

export default function ProjectsPage() {
  const { t } = useLanguage();
  const [profileId, setProfileId] = useState("");
  const [created, setCreated] = useState<Project[]>([]);
  const projects = useApi(() => projectApi.byProfile(profileId ? Number(profileId) : undefined), [profileId]);

  return (
    <div className="grid gap-6 lg:grid-cols-[0.8fr_1.2fr]">
      <section>
        <PageHeader eyebrow={t("projects.eyebrow")} title={t("projects.createTitle")} description={t("projects.createDescription")} />
        <ProjectForm onSaved={(project) => setCreated((items) => [project, ...items])} />
      </section>
      <section>
        <PageHeader eyebrow={t("projects.directoryEyebrow")} title={t("projects.byProfileTitle")} />
        <div className="mb-4 rounded-md border border-line bg-white p-3">
          <input
            value={profileId}
            onChange={(event) => setProfileId(event.target.value)}
            className="focus-ring w-full rounded-md border border-line px-3 py-2 text-sm"
            type="number"
            placeholder={t("projects.profilePlaceholder")}
          />
        </div>
        {projects.loading ? <LoadingState /> : null}
        {projects.error ? <ErrorState message={projects.error} /> : null}
        {!projects.loading && projects.data?.length === 0 && created.length === 0 ? (
          <EmptyState title={t("projects.emptyTitle")} description={t("projects.emptyDescription")} />
        ) : null}
        <div className="grid gap-4">
          {[...created, ...(projects.data ?? [])].map((project, index) => (
            <article key={`${project.id ?? "new"}-${index}`} className="rounded-md border border-line bg-white p-4 shadow-soft">
              <h2 className="font-semibold text-ink">{project.title}</h2>
              <p className="mt-2 text-sm text-muted">{project.description}</p>
            </article>
          ))}
        </div>
      </section>
    </div>
  );
}
