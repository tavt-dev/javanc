"use client";

import { Building2, Inbox, UsersRound } from "lucide-react";
import { Protected } from "@/components/protected";
import { SideNav } from "@/components/side-nav";
import { useLanguage } from "@/lib/i18n";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const { t } = useLanguage();
  return (
    <Protected>
      <div className="grid gap-6 lg:grid-cols-[240px_1fr]">
        <SideNav
          title={t("nav.admin")}
          items={[
            { href: "/admin/users", label: t("admin.user"), icon: UsersRound },
            { href: "/admin/role-requests", label: t("admin.roleRequests"), icon: Inbox },
            { href: "/admin/companies", label: t("nav.companies"), icon: Building2 }
          ]}
        />
        <div>{children}</div>
      </div>
    </Protected>
  );
}
