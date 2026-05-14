"use client";

import { BriefcaseBusiness, Building2, CheckCircle2, FileUser, Sparkles } from "lucide-react";
import { RegisterForm } from "@/features/auth/auth-forms";
import { useLanguage } from "@/lib/i18n";

export default function RegisterPage() {
  const { t } = useLanguage();

  return (
    <div className="grid w-full gap-8 py-8 lg:grid-cols-[0.95fr_1.05fr]">
      <section className="glass-panel scroll-reveal rounded-md p-6 md:p-7">
        <div className="flex h-12 w-12 items-center justify-center rounded-md border border-white/15 bg-accent text-ink shadow-soft">
          <Sparkles className="h-6 w-6" />
        </div>
        <p className="mt-6 text-xs font-semibold uppercase tracking-wide text-accent">{t("auth.registerEyebrow")}</p>
        <h1 className="mt-3 max-w-xl font-serif text-4xl font-bold leading-tight text-white md:text-5xl">{t("auth.registerTitle")}</h1>
        <p className="mt-4 max-w-xl text-sm leading-6 text-white/68">{t("auth.registerDescription")}</p>

        <div className="my-6 h-px bg-white/15" />

        <div className="grid gap-4">
          {[
            { icon: FileUser, title: t("auth.registerCard.profile"), text: t("auth.registerCard.profileText") },
            { icon: BriefcaseBusiness, title: t("auth.registerCard.jobs"), text: t("auth.registerCard.jobsText") },
            { icon: Building2, title: t("auth.registerCard.teams"), text: t("auth.registerCard.teamsText") }
          ].map((item, index) => (
            <div key={item.title} className="grid grid-cols-[auto_1fr] gap-3 rounded-md border border-white/12 bg-white/7 p-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-md bg-white/10 text-accent">
                <item.icon className="h-4 w-4" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="flex h-5 w-5 items-center justify-center rounded-full bg-accent text-[11px] font-bold text-ink">{index + 1}</span>
                  <p className="text-sm font-semibold text-white">{item.title}</p>
                </div>
                <p className="mt-1 text-sm leading-5 text-white/60">{item.text}</p>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-5 inline-flex items-center gap-2 rounded-full border border-emerald-300/25 bg-emerald-400/10 px-3 py-1.5 text-sm font-semibold text-emerald-100">
          <CheckCircle2 className="h-4 w-4" />
          {t("auth.emailVerificationClean")}
        </div>
      </section>

      <section className="scroll-reveal rounded-md border border-line bg-white p-6 shadow-soft">
        <RegisterForm />
      </section>
    </div>
  );
}
