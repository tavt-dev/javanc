"use client";

import { useState } from "react";
import { PageHeader } from "@/components/page-header";
import { ErrorState } from "@/components/data-state";
import { Button, Field, inputClass } from "@/components/ui";
import { companyApi } from "@/lib/api";

export default function ManagerHrPage() {
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  async function assign(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    setSaving(true);
    setError(null);
    setMessage(null);
    try {
      await companyApi.setHr(
        {
          email: String(form.get("email") ?? ""),
          password: String(form.get("password") ?? ""),
          name: String(form.get("name") ?? ""),
          role: "HR"
        },
        Number(form.get("idCompany"))
      );
      setMessage("HR assigned to company.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to assign HR");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div>
      <PageHeader eyebrow="HR" title="Assign HR to company" description="Creates or assigns HR through `/manager/sethrtocompany`." />
      <form onSubmit={assign} className="grid max-w-2xl gap-4 rounded-md border border-line bg-white p-5 shadow-soft">
        {error ? <ErrorState message={error} /> : null}
        {message ? <div className="rounded-md border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">{message}</div> : null}
        <div className="grid gap-4 md:grid-cols-2">
          <Field label="Company ID">
            <input name="idCompany" className={inputClass} type="number" required />
          </Field>
          <Field label="HR name">
            <input name="name" className={inputClass} required />
          </Field>
        </div>
        <div className="grid gap-4 md:grid-cols-2">
          <Field label="HR email">
            <input name="email" className={inputClass} type="email" required />
          </Field>
          <Field label="Temporary password">
            <input name="password" className={inputClass} type="password" required />
          </Field>
        </div>
        <Button type="submit" disabled={saving}>
          {saving ? "Assigning..." : "Assign HR"}
        </Button>
      </form>
    </div>
  );
}
