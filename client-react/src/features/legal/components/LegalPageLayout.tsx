import type { ReactNode } from "react";
import { useTranslation } from "react-i18next";

export type LegalSection = {
  title: string;
  body: string[];
};

type LegalPageLayoutProps = {
  title: string;
  intro: string;
  lastUpdated?: string;
  sections: LegalSection[];
  children?: ReactNode;
};

export function LegalPageLayout({
  title,
  intro,
  lastUpdated,
  sections,
  children,
}: LegalPageLayoutProps) {
  const { t } = useTranslation();

  return (
    <article className="mx-auto w-full max-w-4xl space-y-8 pb-6">
      <header className="space-y-3">
        <p className="text-xs font-semibold uppercase tracking-[0.14em] text-primary">
          {t("legal.eyebrow")}
        </p>
        <div className="space-y-3">
          <h1 className="display-title text-3xl font-semibold text-foreground sm:text-4xl">
            {title}
          </h1>
          <p className="max-w-3xl text-sm leading-7 text-muted-foreground sm:text-base">
            {intro}
          </p>
        </div>
        {lastUpdated && (
          <p className="text-sm text-muted-foreground">
            {t("legal.lastUpdated", { date: lastUpdated })}
          </p>
        )}
      </header>

      {children}

      <div className="space-y-7">
        {sections.map((section) => (
          <section key={section.title} className="space-y-3">
            <h2 className="font-display text-xl font-semibold text-foreground">
              {section.title}
            </h2>
            <div className="space-y-3 text-sm leading-7 text-muted-foreground sm:text-base">
              {section.body.map((paragraph) => (
                <p key={paragraph}>{paragraph}</p>
              ))}
            </div>
          </section>
        ))}
      </div>
    </article>
  );
}
