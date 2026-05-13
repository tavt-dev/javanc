import { Briefcase, Building2, Code2, Layers3, Search, Settings, User } from "lucide-react";
import { Link } from "react-router-dom";
import { getDashboardPath } from "@/routes/dashboard-path";
import { useAuthStore } from "@/stores/auth-store";
import type { Role } from "@/types/auth";

type FooterLink = {
  label: string;
  path: string;
};

const marketplaceLinks: FooterLink[] = [
  { label: "Jobs", path: "/jobs" },
  { label: "Companies", path: "/companies" },
  { label: "Profiles", path: "/profiles" },
  { label: "Projects", path: "/projects" },
];

const roleLinks: Record<Role, FooterLink[]> = {
  user: [
    { label: "My Profile", path: "/profile" },
    { label: "My Applications", path: "/my-applications" },
    { label: "My Projects", path: "/projects" },
  ],
  hr: [
    { label: "Manage Jobs", path: "/hr/jobs" },
    { label: "Notifications", path: "/notifications" },
    { label: "Settings", path: "/settings" },
  ],
  manager: [
    { label: "My Company", path: "/manager/company" },
    { label: "Manage HR", path: "/manager/hr" },
    { label: "Settings", path: "/settings" },
  ],
  admin: [
    { label: "User Management", path: "/admin/users" },
    { label: "Company Mgmt", path: "/admin/companies" },
    { label: "Settings", path: "/settings" },
  ],
};

export function Footer() {
  const role = useAuthStore((state) => state.user?.role);
  const dashboardPath = getDashboardPath(role);
  const workspaceLinks = role ? roleLinks[role] : roleLinks.user;
  const year = new Date().getFullYear();

  return (
    <footer className="border-t border-primary/10 bg-card/86 px-4 py-8 text-sm text-muted-foreground shadow-[0_-16px_40px_hsl(var(--hero-dark)/0.04)] backdrop-blur sm:px-5 md:px-6 lg:px-8">
      <div className="mx-auto grid w-full max-w-[1600px] gap-8 lg:grid-cols-[minmax(0,1.2fr)_minmax(0,1fr)_minmax(0,1fr)_auto]">
        <div className="min-w-0">
          <Link
            to={dashboardPath}
            className="focus-ring inline-flex items-center gap-2 rounded-md"
            aria-label="JavaNC footer home"
          >
            <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary text-sm font-bold text-primary-foreground shadow-sm ring-1 ring-primary/20">
              J
            </span>
            <span className="font-display text-base font-semibold tracking-tight text-foreground">
              JavaNC
            </span>
          </Link>
          <p className="mt-3 max-w-md leading-6">
            Career workspace for finding jobs, managing profiles, and keeping hiring activity moving.
          </p>
          <div className="mt-4 flex flex-wrap gap-2">
            <FooterChip icon={Briefcase} label="Jobs" />
            <FooterChip icon={Building2} label="Companies" />
            <FooterChip icon={Search} label="Profiles" />
          </div>
        </div>

        <FooterColumn title="Marketplace" links={marketplaceLinks} />
        <FooterColumn title="Workspace" links={[{ label: "Dashboard", path: dashboardPath }, ...workspaceLinks]} />

        <div className="min-w-0 lg:text-right">
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-primary">
            Platform
          </p>
          <div className="mt-3 flex flex-col gap-2 lg:items-end">
            <Link to="/settings" className="footer-link focus-ring">
              <Settings size={15} />
              Settings
            </Link>
            <Link to="/profile" className="footer-link focus-ring">
              <User size={15} />
              Account
            </Link>
            <span className="footer-link cursor-default">
              <Code2 size={15} />
              JavaNC 2026
            </span>
          </div>
        </div>
      </div>

      <div className="mx-auto mt-7 flex w-full max-w-[1600px] flex-col gap-2 border-t border-border pt-4 text-xs sm:flex-row sm:items-center sm:justify-between">
        <span>© {year} JavaNC. All rights reserved.</span>
        <span className="inline-flex items-center gap-2">
          <Layers3 size={14} className="text-primary" />
          Job marketplace dashboard
        </span>
      </div>
    </footer>
  );
}

function FooterColumn({ title, links }: { title: string; links: FooterLink[] }) {
  return (
    <nav aria-label={title}>
      <p className="text-xs font-semibold uppercase tracking-[0.14em] text-primary">
        {title}
      </p>
      <div className="mt-3 grid gap-2">
        {links.map((link) => (
          <Link
            key={`${title}-${link.path}-${link.label}`}
            to={link.path}
            className="footer-link focus-ring"
            aria-label={`Footer link to ${link.path}`}
          >
            {link.label}
          </Link>
        ))}
      </div>
    </nav>
  );
}

function FooterChip({ icon: Icon, label }: { icon: typeof Briefcase; label: string }) {
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full border border-primary/12 bg-primary/8 px-2.5 py-1 text-xs font-medium text-primary">
      <Icon size={13} />
      {label}
    </span>
  );
}
