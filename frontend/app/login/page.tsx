"use client";

import { Bell, BriefcaseBusiness, FolderKanban, ShieldCheck, UserRoundCheck } from "lucide-react";
import { LoginForm } from "@/features/auth/auth-forms";
import { useLanguage } from "@/lib/i18n";

export default function LoginPage() {
  const { t } = useLanguage();

  return (
    <div className="grid w-full gap-8 py-8 md:grid-cols-[0.95fr_1.05fr] md:items-start">
      <section className="glass-panel scroll-reveal rounded-md p-6 md:p-7">
        <div className="flex h-12 w-12 items-center justify-center rounded-md border border-white/15 bg-accent text-ink shadow-soft">
          <ShieldCheck className="h-6 w-6" />
        </div>
        <p className="mt-6 text-xs font-semibold uppercase tracking-wide text-accent">{t("auth.loginEyebrow")}</p>
        <h1 className="mt-3 max-w-xl font-serif text-4xl font-bold leading-tight text-white md:text-5xl">{t("auth.loginTitle")}</h1>
        <p className="mt-4 max-w-xl text-sm leading-6 text-white/68">{t("auth.loginDescription")}</p>

        <div className="my-6 h-px bg-white/15" />

        <div className="grid gap-3">
          {[
            { icon: UserRoundCheck, label: t("auth.loginCard.profile"), text: t("auth.loginCard.profileText") },
            { icon: FolderKanban, label: t("auth.loginCard.projects"), text: t("auth.loginCard.projectsText") },
            { icon: Bell, label: t("auth.loginCard.notifications"), text: t("auth.loginCard.notificationsText") },
            { icon: BriefcaseBusiness, label: t("auth.loginCard.hiring"), text: t("auth.loginCard.hiringText") }
          ].map((item) => (
            <div key={item.label} className="flex gap-3 rounded-md border border-white/12 bg-white/7 p-3">
              <div className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-white/10 text-accent">
                <item.icon className="h-4 w-4" />
              </div>
              <div>
                <p className="text-sm font-semibold text-white">{item.label}</p>
                <p className="mt-1 text-sm leading-5 text-white/60">{item.text}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="scroll-reveal rounded-md border border-line bg-white p-6 shadow-soft">
        <LoginForm />
      </section>
    </div>
  );
}
