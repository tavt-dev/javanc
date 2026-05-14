"use client";

import { useEffect, useState } from "react";
import { jobApi } from "@/lib/api";
import type { Company, Job } from "@/lib/types";
import { Button, Field, inputClass } from "@/components/ui";
import { ErrorState } from "@/components/data-state";
import { useLanguage } from "@/lib/i18n";

export function JobForm({ companies = [], onSaved }: { companies?: Company[]; onSaved?: (job: Job) => void }) {
  const { t } = useLanguage();
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [selectedCompanyId, setSelectedCompanyId] = useState<number | null>(companies[0]?.id ?? null);
  const selectedCompany = companies.find((company) => company.id === selectedCompanyId);

  useEffect(() => {
    if (!selectedCompanyId && companies[0]?.id) {
      setSelectedCompanyId(companies[0].id);
    }
  }, [companies, selectedCompanyId]);

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
      setSelectedCompanyId(companies[0]?.id ?? null);
      onSaved?.(saved);
    } catch (err) {
      setError(err instanceof Error ? err.message : t("jobs.unableSave"));
    } finally {
      setSaving(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="scroll-reveal grid gap-4 rounded-md border border-line bg-white p-5 text-ink shadow-soft">
      {error ? <ErrorState message={error} /> : null}
      <div className="grid gap-4 md:grid-cols-2">
        <Field label={t("jobs.titleLabel")}>
          <input className={inputClass} name="title" required />
        </Field>
        <Field label={t("jobs.typeLabel")}>
          <select className={inputClass} name="typeJob">
            <option value="java">Java</option>
            <option value="python">Python</option>
            <option value="php">PHP</option>
          </select>
        </Field>
      </div>
      <Field label={t("jobs.descriptionLabel")}>
        <textarea className={inputClass} name="description" rows={3} required />
      </Field>
      <div className="grid gap-4 md:grid-cols-2">
        <Field label={t("jobs.teamSizeLabel")}>
          <input className={inputClass} name="size" type="number" min={0} />
        </Field>
        <Field label={t("jobs.company")}>
          <select
            className={inputClass}
            name="idCompany"
            required
            value={selectedCompanyId ?? ""}
            onChange={(event) => setSelectedCompanyId(Number(event.target.value))}
            disabled={!companies.length}
          >
            <option value="" disabled>
              {t("jobs.selectCompany")}
            </option>
            {companies.map((company) => (
              <option key={company.id} value={company.id}>
                {company.name || t("state.unnamedCompany")} {company.city ? `- ${company.city}` : ""}
              </option>
            ))}
          </select>
        </Field>
      </div>
      {selectedCompany ? (
        <div className="rounded-md border border-line bg-slate-50 p-3 text-sm">
          <p className="font-semibold text-ink">{selectedCompany.name || t("common.selectedCompany")}</p>
          <p className="mt-1 text-muted">
            {[selectedCompany.city, selectedCompany.country].filter(Boolean).join(", ") || t("state.locationNotSet")}
          </p>
          <p className="mt-1 line-clamp-2 text-muted">{selectedCompany.description || t("state.noCompanyDescription")}</p>
        </div>
      ) : null}
      <Button type="submit" disabled={saving || !companies.length}>
        {saving ? t("jobs.saving") : t("jobs.create")}
      </Button>
    </form>
  );
}
