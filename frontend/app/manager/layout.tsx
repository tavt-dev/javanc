"use client";

import { BriefcaseBusiness, Building2, UsersRound, UserRoundCheck } from "lucide-react";
import { Protected } from "@/components/protected";
import { SideNav } from "@/components/side-nav";
import { useAuth } from "@/features/auth/auth-provider";
import { useLanguage } from "@/lib/i18n";

export default function ManagerLayout({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const { t } = useLanguage();
  const role = user?.role?.toLowerCase();
  const items =
    role === "hr"
      ? [
          { href: "/manager/jobs", label: t("nav.jobs"), icon: BriefcaseBusiness },
          { href: "/manager/employees", label: t("manager.employeesTitle"), icon: UsersRound }
        ]
      : [
          { href: "/manager/company", label: t("manager.company"), icon: Building2 },
          { href: "/manager/jobs", label: t("nav.jobs"), icon: BriefcaseBusiness },
          { href: "/manager/hr", label: "HR", icon: UserRoundCheck },
          { href: "/manager/employees", label: t("manager.employeesTitle"), icon: UsersRound }
        ];

  return (
    <Protected>
      <div className="grid gap-6 lg:grid-cols-[240px_1fr]">
        <SideNav title={role === "hr" ? "HR" : t("nav.manager")} items={items} />
        <div>{children}</div>
      </div>
    </Protected>
  );
}
