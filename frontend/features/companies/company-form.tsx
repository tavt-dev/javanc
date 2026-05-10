"use client";

import { useState } from "react";
import { companyApi } from "@/lib/api";
import type { Company } from "@/lib/types";
import { Button, Field, inputClass } from "@/components/ui";
import { ErrorState } from "@/components/data-state";

export function CompanyForm({ onSaved }: { onSaved?: (company: Company) => void }) {
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);
    setError(null);

    try {
      const saved = await companyApi.create(new FormData(event.currentTarget));
      event.currentTarget.reset();
      onSaved?.(saved);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to save company");
    } finally {
      setSaving(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="grid gap-4 rounded-md border border-line bg-white p-5">
      {error ? <ErrorState message={error} /> : null}
      <div className="grid gap-4 md:grid-cols-2">
        <Field label="Company name">
          <input className={inputClass} name="name" required />
        </Field>
        <Field label="Type">
          <input className={inputClass} name="type" placeholder="Software, Finance, Healthcare" />
        </Field>
      </div>
      <Field label="Description">
        <textarea className={inputClass} name="description" rows={3} />
      </Field>
      <div className="grid gap-4 md:grid-cols-3">
        <Field label="Email">
          <input className={inputClass} name="email" type="email" />
        </Field>
        <Field label="Phone">
          <input className={inputClass} name="phone" />
        </Field>
        <Field label="City">
          <input className={inputClass} name="city" />
        </Field>
      </div>
      <div className="grid gap-4 md:grid-cols-2">
        <Field label="Street">
          <input className={inputClass} name="street" />
        </Field>
        <Field label="Country">
          <input className={inputClass} name="country" />
        </Field>
      </div>
      <Field label="Logo">
        <input className={inputClass} name="image" type="file" accept="image/*" />
      </Field>
      <Button type="submit" disabled={saving}>
        {saving ? "Saving..." : "Create company"}
      </Button>
    </form>
  );
}
