"use client";

import { useEffect, useState } from "react";
import { PageHeader } from "@/components/page-header";
import { EmptyState, ErrorState, LoadingState } from "@/components/data-state";
import { ProjectForm } from "@/features/projects/project-form";
import { projectApi } from "@/lib/api";
import { useApi } from "@/lib/use-api";
import type { Project } from "@/lib/types";
import { useLanguage } from "@/lib/i18n";
import { useAuth } from "@/features/auth/auth-provider";
import { Protected } from "@/components/protected";

export default function ProjectsPage() {
  const { t } = useLanguage();
  const { signedIn } = useAuth();
  const [items, setItems] = useState<Project[]>([]);
  const [editing, setEditing] = useState<Project | null>(null);
  const projects = useApi(() => (signedIn ? projectApi.myProjects() : Promise.resolve([])), [signedIn]);

  useEffect(() => {
    setItems(projects.data ?? []);
  }, [projects.data]);

  async function deleteProject(id?: number) {
    if (!id || !window.confirm("Delete this project?")) {
      return;
    }
    await projectApi.deleteMine(id);
    setItems((current) => current.filter((project) => project.id !== id));
  }

  return (
    <Protected>
    <div className="grid gap-6 lg:grid-cols-[0.8fr_1.2fr]">
      <section>
        <PageHeader eyebrow={t("projects.eyebrow")} title={t("projects.createTitle")} description={t("projects.createDescription")} />
        <ProjectForm
          initialProject={editing}
          onCancel={editing ? () => setEditing(null) : undefined}
          onSaved={(project) => {
            setEditing(null);
            setItems((current) => [project, ...current.filter((item) => item.id !== project.id)]);
          }}
        />
      </section>
      <section>
        <PageHeader eyebrow={t("projects.directoryEyebrow")} title="My projects" />
        {projects.loading ? <LoadingState /> : null}
        {projects.error ? <ErrorState message={projects.error} /> : null}
        {!projects.loading && items.length === 0 ? (
          <EmptyState title={t("projects.emptyTitle")} description={t("projects.emptyDescription")} />
        ) : null}
        <div className="grid gap-4">
          {items.map((project, index) => (
            <article key={`${project.id ?? "new"}-${index}`} className="rounded-md border border-line bg-white p-4 shadow-soft">
              <div className="flex items-start justify-between gap-3">
                <h2 className="font-semibold text-ink">{project.title}</h2>
                <div className="flex gap-2">
                  <button className="text-sm font-semibold text-brand" type="button" onClick={() => setEditing(project)}>
                    Edit
                  </button>
                  <button className="text-sm font-semibold text-danger" type="button" onClick={() => deleteProject(project.id)}>
                    Delete
                  </button>
                </div>
              </div>
              <p className="mt-2 text-sm text-muted">{project.description}</p>
            </article>
          ))}
        </div>
      </section>
    </div>
    </Protected>
  );
}
