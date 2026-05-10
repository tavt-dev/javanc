"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { LucideIcon } from "lucide-react";

export function SideNav({
  title,
  items
}: {
  title: string;
  items: Array<{ href: string; label: string; icon: LucideIcon }>;
}) {
  const pathname = usePathname();

  return (
    <aside className="rounded-md border border-line bg-white p-3 shadow-soft">
      <p className="px-2 pb-2 text-xs font-semibold uppercase tracking-wide text-muted">{title}</p>
      <nav className="space-y-1">
        {items.map((item) => {
          const active = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`focus-ring flex items-center gap-2 rounded-md px-3 py-2 text-sm font-semibold ${
                active ? "bg-ink text-white" : "text-muted hover:bg-canvas hover:text-ink"
              }`}
            >
              <item.icon className="h-4 w-4" />
              {item.label}
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
