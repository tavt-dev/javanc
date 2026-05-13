"use client";

import { BriefcaseBusiness, Building2, UsersRound, UserRoundCheck } from "lucide-react";
import { Protected } from "@/components/protected";
import { SideNav } from "@/components/side-nav";

export default function ManagerLayout({ children }: { children: React.ReactNode }) {
  return (
    <Protected>
      <div className="grid gap-6 lg:grid-cols-[240px_1fr]">
        <SideNav
          title="Manager"
          items={[
            { href: "/manager/company", label: "Company", icon: Building2 },
            { href: "/manager/jobs", label: "Jobs", icon: BriefcaseBusiness },
            { href: "/manager/hr", label: "HR", icon: UserRoundCheck },
            { href: "/manager/employees", label: "Employees", icon: UsersRound }
          ]}
        />
        <div>{children}</div>
      </div>
    </Protected>
  );
}
