"use client";

import { useState } from "react";
import { projectApi } from "@/lib/api";
import type { Project } from "@/lib/types";
import { Button, Field, inputClass } from "@/components/ui";
import { ErrorState } from "@/components/data-state";
import { useLanguage } from "@/lib/i18n";

export function ProjectForm({
  idProfile,
  initialProject,
  onCancel,
  onSaved,
  userProject = true
}: {
  idProfile?: number;
  initialProject?: Project | null;
  onCancel?: () => void;
  onSaved?: (project: Project) => void;
  userProject?: boolean;
}) {
  const { t } = useLanguage();
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formElement = event.currentTarget;
    const form = new FormData(formElement);
    const project: Project = {
      id: initialProject?.id,
      title: String(form.get("title") ?? ""),
      description: String(form.get("description") ?? ""),
      url: String(form.get("url") ?? ""),
      display: form.get("display") === "on",
      idProfile: Number(form.get("idProfile") || idProfile || 0)
    };

    setSaving(true);
    setError(null);
    try {
      const saved = initialProject?.id
        ? await projectApi.updateMine(project)
        : userProject
          ? await projectApi.createMine(project)
          : await projectApi.save(project);
      if (!initialProject?.id) {
        formElement.reset();
      }
      onSaved?.(saved);
    } catch (err) {
      setError(err instanceof Error ? err.message : t("projects.unableSave"));
    } finally {
      setSaving(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="grid gap-4 rounded-md border border-line bg-white p-5">
      {error ? <ErrorState message={error} /> : null}
      <Field label={t("projects.titleLabel")}>
        <input className={inputClass} name="title" placeholder={t("projects.titlePlaceholder")} defaultValue={initialProject?.title} required />
      </Field>
      <Field label={t("projects.descriptionLabel")}>
        <textarea className={inputClass} name="description" rows={3} defaultValue={initialProject?.description} required />
      </Field>
      <div className={`grid gap-4 ${userProject ? "" : "md:grid-cols-2"}`}>
        <Field label={t("projects.urlLabel")}>
          <input className={inputClass} name="url" placeholder="https://..." defaultValue={initialProject?.url} />
        </Field>
        {!userProject ? (
          <Field label={t("projects.profileIdLabel")}>
            <input className={inputClass} name="idProfile" type="number" defaultValue={initialProject?.idProfile ?? idProfile} />
          </Field>
        ) : null}
      </div>
      <label className="flex items-center gap-2 text-sm font-medium text-ink">
        <input name="display" type="checkbox" defaultChecked={initialProject?.display ?? true} />
        {t("projects.displayLabel")}
      </label>
      <div className="flex justify-end gap-2">
        {onCancel ? (
          <Button type="button" variant="secondary" onClick={onCancel}>
            {t("common.cancel")}
          </Button>
        ) : null}
        <Button type="submit" disabled={saving}>
          {saving ? t("projects.saving") : initialProject?.id ? t("projects.update") : t("projects.create")}
        </Button>
      </div>
    </form>
  );
}
