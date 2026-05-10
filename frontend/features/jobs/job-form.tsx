"use client";

import { useState } from "react";
import { jobApi } from "@/lib/api";
import type { Job } from "@/lib/types";
import { Button, Field, inputClass } from "@/components/ui";
import { ErrorState } from "@/components/data-state";

export function JobForm({ onSaved }: { onSaved?: (job: Job) => void }) {
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const job: Job = {
      title: String(form.get("title") ?? ""),
      description: String(form.get("description") ?? ""),
      typeJob: String(form.get("typeJob") ?? ""),
      size: Number(form.get("size") || 0),
      idCompany: Number(form.get("idCompany") || 0)
    };

    setSaving(true);
    setError(null);
    try {
      const saved = await jobApi.create(job);
      event.currentTarget.reset();
      onSaved?.(saved);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to save job");
    } finally {
      setSaving(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="grid gap-4 rounded-md border border-line bg-white p-5">
      {error ? <ErrorState message={error} /> : null}
      <div className="grid gap-4 md:grid-cols-2">
        <Field label="Job title">
          <input className={inputClass} name="title" required />
        </Field>
        <Field label="Type">
          <select className={inputClass} name="typeJob">
            <option value="FULL_TIME">Full time</option>
            <option value="PART_TIME">Part time</option>
            <option value="REMOTE">Remote</option>
          </select>
        </Field>
      </div>
      <Field label="Description">
        <textarea className={inputClass} name="description" rows={3} required />
      </Field>
      <div className="grid gap-4 md:grid-cols-2">
        <Field label="Team size">
          <input className={inputClass} name="size" type="number" min={0} />
        </Field>
        <Field label="Company ID">
          <input className={inputClass} name="idCompany" type="number" required />
        </Field>
      </div>
      <Button type="submit" disabled={saving}>
        {saving ? "Saving..." : "Create job"}
      </Button>
    </form>
  );
}
