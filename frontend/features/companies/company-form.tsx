"use client";

import { useEffect, useState } from "react";
import { companyApi } from "@/lib/api";
import type { Company } from "@/lib/types";
import { Button, Field, inputClass } from "@/components/ui";
import { ErrorState } from "@/components/data-state";
import { useLanguage } from "@/lib/i18n";

export function CompanyForm({
  onSaved,
  onDraft,
  managerId
}: {
  onSaved?: (company: Company) => void;
  onDraft?: (company: Company) => void;
  managerId?: number;
}) {
  const { t } = useLanguage();
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [logoPreview, setLogoPreview] = useState<string | null>(null);

  useEffect(() => () => {
    if (logoPreview?.startsWith("blob:")) {
      URL.revokeObjectURL(logoPreview);
    }
  }, [logoPreview]);

  function updateDraft(form: HTMLFormElement) {
    const formData = new FormData(form);
    onDraft?.({
      name: String(formData.get("name") ?? ""),
      type: String(formData.get("type") ?? ""),
      description: String(formData.get("description") ?? ""),
      email: String(formData.get("email") ?? ""),
      phone: String(formData.get("phone") ?? ""),
      city: String(formData.get("city") ?? ""),
      street: String(formData.get("street") ?? ""),
      country: String(formData.get("country") ?? ""),
      url: logoPreview ?? undefined
    });
  }

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
    <form onSubmit={onSubmit} onChange={(event) => updateDraft(event.currentTarget)} className="grid gap-4 rounded-md border border-line bg-white p-5">
      {error ? <ErrorState message={error} /> : null}
      {managerId ? <input type="hidden" name="idManager" value={managerId} /> : null}
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
        <div className="grid gap-3 sm:grid-cols-[96px_1fr] sm:items-center">
          <div className="flex h-24 w-24 items-center justify-center overflow-hidden rounded-md border border-line bg-canvas text-xl font-bold text-brand">
            {logoPreview ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={logoPreview} alt="Company logo preview" className="h-full w-full object-cover" />
            ) : (
              "Logo"
            )}
          </div>
          <input
            className={inputClass}
            name="image"
            type="file"
            accept="image/*"
            onChange={(event) => {
              const file = event.target.files?.[0];
              if (!file) {
                setLogoPreview(null);
                return;
              }
              setLogoPreview((current) => {
                if (current?.startsWith("blob:")) {
                  URL.revokeObjectURL(current);
                }
                return URL.createObjectURL(file);
              });
            }}
          />
        </div>
      </Field>
      <Button type="submit" disabled={saving}>
        {saving ? t("companies.saving") : t("companies.create")}
      </Button>
    </form>
  );
}
