"use client";

import { Building2, Inbox, UsersRound } from "lucide-react";
import { Protected } from "@/components/protected";
import { SideNav } from "@/components/side-nav";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <Protected>
      <div className="grid gap-6 lg:grid-cols-[240px_1fr]">
        <SideNav
          title="Admin"
          items={[
            { href: "/admin/users", label: "Users", icon: UsersRound },
            { href: "/admin/role-requests", label: "Role Requests", icon: Inbox },
            { href: "/admin/companies", label: "Companies", icon: Building2 }
          ]}
        />
        <div>{children}</div>
      </div>
    </Protected>
  );
}
