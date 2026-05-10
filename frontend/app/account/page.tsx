"use client";

import { Protected } from "@/components/protected";
import { PageHeader } from "@/components/page-header";
import { useAuth } from "@/features/auth/auth-provider";
import { Pill } from "@/components/ui";

export default function AccountPage() {
  const { user } = useAuth();

  return (
    <Protected>
      <PageHeader eyebrow="Account" title={user?.name || "Current user"} description="View your account details and workspace access." />
      <section className="rounded-md border border-line bg-white p-5 shadow-soft">
        <div className="grid gap-4 text-sm md:grid-cols-2">
          <div>
            <p className="font-semibold text-ink">Email</p>
            <p className="mt-1 text-muted">{user?.email || "Not available"}</p>
          </div>
          <div>
            <p className="font-semibold text-ink">Role</p>
            <p className="mt-1">
              <Pill tone="blue">{user?.role || "Unknown"}</Pill>
            </p>
          </div>
          <div>
            <p className="font-semibold text-ink">User ID</p>
            <p className="mt-1 text-muted">{user?.id ?? "Not available"}</p>
          </div>
          <div>
            <p className="font-semibold text-ink">Employee ID</p>
            <p className="mt-1 text-muted">{user?.idEmployee || "Not available"}</p>
          </div>
        </div>
      </section>
    </Protected>
  );
}
