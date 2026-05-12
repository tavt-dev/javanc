"use client";

import { useState } from "react";
import { companyApi } from "@/lib/api";
import type { Company } from "@/lib/types";
import { Button, Field, inputClass } from "@/components/ui";
import { ErrorState } from "@/components/data-state";
import { useLanguage } from "@/lib/i18n";

export function CompanyForm({ onSaved }: { onSaved?: (company: Company) => void }) {
  const { t } = useLanguage();
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
        <Field label={t("companies.nameLabel")}>
          <input className={inputClass} name="name" required />
        </Field>
        <Field label={t("companies.typeLabel")}>
          <input className={inputClass} name="type" placeholder="Software, Finance, Healthcare" />
        </Field>
      </div>
      <Field label={t("companies.descriptionLabel")}>
        <textarea className={inputClass} name="description" rows={3} />
      </Field>
      <div className="grid gap-4 md:grid-cols-3">
        <Field label={t("companies.emailLabel")}>
          <input className={inputClass} name="email" type="email" />
        </Field>
        <Field label={t("companies.phoneLabel")}>
          <input className={inputClass} name="phone" />
        </Field>
        <Field label={t("companies.cityLabel")}>
          <input className={inputClass} name="city" />
        </Field>
      </div>
      <div className="grid gap-4 md:grid-cols-2">
        <Field label={t("companies.streetLabel")}>
          <input className={inputClass} name="street" />
        </Field>
        <Field label={t("companies.countryLabel")}>
          <input className={inputClass} name="country" />
        </Field>
      </div>
      <Field label={t("companies.logoLabel")}>
        <input className={inputClass} name="image" type="file" accept="image/*" />
      </Field>
      <Button type="submit" disabled={saving}>
        {saving ? t("companies.saving") : t("companies.create")}
      </Button>
    </form>
  );
}
