"use client";

import { PageHeader } from "@/components/page-header";
import { useLanguage } from "@/lib/i18n";

export function InfoPage({
  namespace,
  sections
}: {
  namespace: "about" | "terms" | "privacy";
  sections: Array<"mission" | "roles" | "use" | "content" | "data" | "control">;
}) {
  const { t } = useLanguage();

  return (
    <div className="mx-auto max-w-4xl">
      <PageHeader
        eyebrow={t(`${namespace}.eyebrow`)}
        title={t(`${namespace}.title`)}
        description={t(`${namespace}.description`)}
      />
      <div className="grid gap-4">
        {sections.map((section) => (
          <section key={section} className="glass-panel rounded-md p-5">
            <h2 className="text-lg font-semibold text-white">{t(`${namespace}.${section}Title`)}</h2>
            <p className="mt-2 leading-7 text-white/70">{t(`${namespace}.${section}Body`)}</p>
          </section>
        ))}
      </div>
    </div>
  );
}
