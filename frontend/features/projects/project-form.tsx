"use client";

import { useState } from "react";
import { projectApi } from "@/lib/api";
import type { Project } from "@/lib/types";
import { Button, Field, inputClass } from "@/components/ui";
import { ErrorState } from "@/components/data-state";
import { useLanguage } from "@/lib/i18n";

export function ProjectForm({ idProfile, onSaved }: { idProfile?: number; onSaved?: (project: Project) => void }) {
  const { t } = useLanguage();
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const project: Project = {
      title: String(form.get("title") ?? ""),
      description: String(form.get("description") ?? ""),
      url: String(form.get("url") ?? ""),
      display: form.get("display") === "on",
      idProfile: Number(form.get("idProfile") || idProfile || 0)
    };

    setSaving(true);
    setError(null);
    try {
      const saved = await projectApi.save(project);
      event.currentTarget.reset();
      onSaved?.(saved);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to save project");
    } finally {
      setSaving(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="grid gap-4 rounded-md border border-line bg-white p-5">
      {error ? <ErrorState message={error} /> : null}
      <Field label={t("projects.titleLabel")}>
        <input className={inputClass} name="title" placeholder="Portfolio platform" required />
      </Field>
      <Field label={t("projects.descriptionLabel")}>
        <textarea className={inputClass} name="description" rows={3} required />
      </Field>
      <div className="grid gap-4 md:grid-cols-2">
        <Field label={t("projects.urlLabel")}>
          <input className={inputClass} name="url" placeholder="https://..." />
        </Field>
        <Field label={t("projects.profileIdLabel")}>
          <input className={inputClass} name="idProfile" type="number" defaultValue={idProfile} />
        </Field>
      </div>
      <label className="flex items-center gap-2 text-sm font-medium text-ink">
        <input name="display" type="checkbox" defaultChecked />
        {t("projects.displayLabel")}
      </label>
      <Button type="submit" disabled={saving}>
        {saving ? t("projects.saving") : t("projects.create")}
      </Button>
    </form>
  );
}
