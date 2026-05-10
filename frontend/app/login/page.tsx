"use client";

import { LoginForm } from "@/features/auth/auth-forms";
import { useLanguage } from "@/lib/i18n";

export default function LoginPage() {
  const { t } = useLanguage();

  return (
    <div className="grid w-full gap-8 py-8 md:grid-cols-[0.9fr_1.1fr] md:items-start">
      <div className="rounded-md border border-line bg-white p-6 shadow-soft">
        <p className="text-xs font-semibold uppercase tracking-wide text-brand">{t("auth.loginEyebrow")}</p>
        <h1 className="mt-2 text-3xl font-bold text-ink">{t("auth.loginTitle")}</h1>
        <p className="mt-4 text-sm leading-6 text-muted">
          {t("auth.loginDescription")}
        </p>
      </div>
      <section className="rounded-md border border-line bg-white p-6 shadow-soft">
        <LoginForm />
      </section>
    </div>
  );
}
