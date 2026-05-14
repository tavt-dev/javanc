"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { useRouter } from "next/navigation";
import { Mail, Phone } from "lucide-react";
import { PageHeader } from "@/components/page-header";
import { EmptyState, ErrorState, LoadingState } from "@/components/data-state";
import { Button, LinkButton, Pill } from "@/components/ui";
import { imageApi, profileApi, projectApi } from "@/lib/api";
import { useApi } from "@/lib/use-api";
import { useAuth } from "@/features/auth/auth-provider";
import { ProjectForm } from "@/features/projects/project-form";
import type { Project } from "@/lib/types";
import { useLanguage } from "@/lib/i18n";

export default function ProfileDetailPage() {
  const { t } = useLanguage();
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const id = Number(params.id);
  const { signedIn, user } = useAuth();
  const profile = useApi(() => profileApi.findById(id), [id]);
  const projects = useApi(() => (signedIn ? projectApi.byProfile(id) : Promise.resolve([])), [id, signedIn]);
  const [projectItems, setProjectItems] = useState<Project[]>([]);
  const [editingProject, setEditingProject] = useState<Project | null>(null);
  const previewImage = useApi(
    () => (profile.data?.url ? imageApi.previewUrl(profile.data.url, 160) : Promise.resolve(null)),
    [profile.data?.url]
  );
  const canManage = profile.data?.idUser === user?.id;

  useEffect(() => {
    setProjectItems(projects.data ?? []);
  }, [projects.data]);

  async function deleteProfile() {
    if (!window.confirm(t("profile.removeConfirm"))) {
      return;
    }
    await profileApi.deleteMe();
    router.push("/profiles");
  }

  async function deleteProject(projectId?: number) {
    if (!projectId || !window.confirm(t("projects.deleteConfirm"))) {
      return;
    }
    await projectApi.deleteMine(projectId);
    setProjectItems((current) => current.filter((project) => project.id !== projectId));
  }

  if (profile.loading) {
    return <LoadingState label={t("state.loading")} />;
  }

  if (profile.error) {
    return <ErrorState message={profile.error} />;
  }

  if (!profile.data) {
    return <EmptyState title={t("profile.notFound")} description={t("profile.notFoundDescription")} />;
  }

  return (
    <div>
      <PageHeader
        eyebrow={t("profile.createEyebrow")}
        title={profile.data.name || profile.data.title || profile.data.objective || `Profile #${profile.data.id}`}
        description={profile.data.objective}
        breadcrumbs={[{ label: t("nav.profiles"), href: "/profiles" }, { label: profile.data.name || profile.data.title || `Profile #${profile.data.id}` }]}
        actions={
          canManage ? (
            <div className="flex gap-2">
              <LinkButton href="/profile/edit" variant="secondary">{t("common.edit")}</LinkButton>
              <Button type="button" variant="danger" onClick={deleteProfile}>{t("common.delete")}</Button>
            </div>
          ) : null
        }
      />
      <div className="grid gap-6 lg:grid-cols-[0.75fr_1.25fr]">
        <aside className="rounded-md border border-line bg-white p-5 shadow-soft">
          {profile.data.url ? (
            <div className="mb-4 flex items-center gap-4">
              <div className="h-28 w-28 overflow-hidden rounded-md border border-line bg-slate-50">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={previewImage.data || profile.data.url} alt="" className="h-full w-full object-cover" />
              </div>
            </div>
          ) : null}
          {profile.data.title ? <h2 className="mb-3 font-serif text-2xl font-bold text-ink">{profile.data.title}</h2> : null}
          <Pill tone="blue">{profile.data.typeProfile || t("common.profile")}</Pill>
          <div className="mt-5 space-y-3 text-sm text-muted">
            <p>{profile.data.education || t("profile.educationMissing")}</p>
            <p>{profile.data.workExperience || t("profile.experienceMissing")}</p>
            <p className="font-medium text-ink">{profile.data.skills || t("profile.skillsMissing")}</p>
          </div>
          <div className="mt-5 space-y-2 border-t border-line pt-4 text-sm text-muted">
            <p className="flex items-center gap-2">
              <Mail className="h-4 w-4" />
              {profile.data.contact?.email || t("state.emailNotSet")}
            </p>
            <p className="flex items-center gap-2">
              <Phone className="h-4 w-4" />
              {profile.data.contact?.phone || t("state.phoneNotSet")}
            </p>
          </div>
        </aside>
        <section>
          <div className="mb-3 flex items-center justify-between gap-3">
            <h2 className="text-lg font-semibold text-white">{t("nav.projects")}</h2>
            {canManage && !editingProject ? (
              <button type="button" className="text-sm font-semibold text-accent" onClick={() => setEditingProject({})}>
                {t("projects.create")}
              </button>
            ) : null}
          </div>
          {canManage && editingProject ? (
            <div className="mb-4">
              <ProjectForm
                initialProject={editingProject.id ? editingProject : null}
                onCancel={() => setEditingProject(null)}
                onSaved={(project) => {
                  setEditingProject(null);
                  setProjectItems((current) => [project, ...current.filter((item) => item.id !== project.id)]);
                }}
              />
            </div>
          ) : null}
          {projects.loading ? <LoadingState /> : null}
          {projects.error ? <ErrorState message={projects.error} /> : null}
          {!projects.loading && projectItems.length === 0 ? (
            <EmptyState title={t("projects.emptyTitle")} description={t("projects.emptyDescription")} />
          ) : null}
          <div className="grid gap-4">
            {projectItems.map((project) => (
              <article key={project.id} className="rounded-md border border-line bg-white p-4 shadow-soft">
                <div className="flex items-start justify-between gap-3">
                  <h3 className="font-semibold text-ink">{project.title}</h3>
                  {canManage ? (
                    <div className="flex gap-2">
                      <button type="button" className="text-sm font-semibold text-brand" onClick={() => setEditingProject(project)}>
                        {t("common.edit")}
                      </button>
                      <button type="button" className="text-sm font-semibold text-danger" onClick={() => deleteProject(project.id)}>
                        {t("common.delete")}
                      </button>
                    </div>
                  ) : null}
                </div>
                <p className="mt-2 text-sm text-muted">{project.description}</p>
                {project.url ? (
                  <a className="mt-3 inline-flex text-sm font-semibold text-brand" href={project.url} target="_blank" rel="noreferrer">
                    {t("projects.urlLabel")}
                  </a>
                ) : null}
              </article>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}
