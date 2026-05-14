"use client";

import { Breadcrumbs } from "@/components/ui";
import { useLanguage } from "@/lib/i18n";

export function PageHeader({
  eyebrow,
  title,
  description,
  actions,
  backHref,
  backLabel,
  breadcrumbs
}: {
  eyebrow?: string;
  title: string;
  description?: string;
  actions?: React.ReactNode;
  backHref?: string;
  backLabel?: string;
  breadcrumbs?: Array<{ label: string; href?: string }>;
}) {
  const { t } = useLanguage();
  const resolvedBackLabel = backLabel ?? t("common.back");
  return (
    <div className="mb-6 flex flex-col justify-between gap-4 border-b border-white/15 pb-5 md:flex-row md:items-end">
      <div>
        {breadcrumbs ? <Breadcrumbs items={breadcrumbs} /> : backHref !== undefined ? <Breadcrumbs items={[{ label: resolvedBackLabel, href: backHref || undefined }, { label: title }]} /> : null}
        {eyebrow ? <p className="text-xs font-semibold uppercase tracking-wide text-accent">{eyebrow}</p> : null}
        <h1 className="mt-1 font-serif text-2xl font-bold text-white md:text-3xl">{title}</h1>
        {description ? <p className="mt-2 max-w-3xl text-sm leading-6 text-white/65">{description}</p> : null}
      </div>
      {actions ? <div className="flex items-center gap-2">{actions}</div> : null}
    </div>
  );
}
