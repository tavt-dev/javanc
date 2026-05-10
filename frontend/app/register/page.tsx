"use client";

import { RegisterForm } from "@/features/auth/auth-forms";
import { useLanguage } from "@/lib/i18n";

export default function RegisterPage() {
  const { t } = useLanguage();

  return (
    <div className="grid w-full gap-8 py-8 lg:grid-cols-[0.85fr_1.15fr]">
      <div className="rounded-md border border-line bg-white p-6 shadow-soft">
        <p className="text-xs font-semibold uppercase tracking-wide text-brand">{t("auth.registerEyebrow")}</p>
        <h1 className="mt-2 text-3xl font-bold text-ink">{t("auth.registerTitle")}</h1>
        <p className="mt-2 text-sm text-muted">{t("auth.registerDescription")}</p>
      </div>
      <section className="rounded-md border border-line bg-white p-6 shadow-soft">
        <RegisterForm />
      </section>
    </div>
  );
}
