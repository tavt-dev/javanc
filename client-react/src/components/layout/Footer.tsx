import { Briefcase, Building2, Code2, Layers3, Search, Settings, User } from "lucide-react";
import { useTranslation } from "react-i18next";
import { Link } from "react-router-dom";
import { getDashboardPath } from "@/routes/dashboard-path";
import { useAuthStore } from "@/stores/auth-store";
import type { Role } from "@/types/auth";
import { primaryNavItems, visibleRoleNavItems } from "./navigation";

type FooterLink = {
  labelKey: string;
  path: string;
};

const marketplaceLinks: FooterLink[] = [
  ...primaryNavItems.filter((item) => item.path !== "/notifications"),
];

const roleLinks: Record<Role, FooterLink[]> = {
  user: [
    { labelKey: "nav.items.profile", path: "/profile" },
    { labelKey: "nav.items.applications", path: "/my-applications" },
    { labelKey: "nav.items.projects", path: "/projects" },
  ],
  hr: [...visibleRoleNavItems("hr"), { labelKey: "nav.items.notifications", path: "/notifications" }, { labelKey: "nav.items.settings", path: "/settings" }],
  manager: [...visibleRoleNavItems("manager"), { labelKey: "nav.items.settings", path: "/settings" }],
  admin: [...visibleRoleNavItems("admin"), { labelKey: "nav.items.settings", path: "/settings" }],
};

const legalLinks: FooterLink[] = [
  { labelKey: "footer.about", path: "/about" },
  { labelKey: "footer.privacy", path: "/privacy" },
  { labelKey: "footer.terms", path: "/terms" },
];

export function Footer() {
  const { t } = useTranslation();
  const role = useAuthStore((state) => state.user?.role);
  const dashboardPath = getDashboardPath(role);
  const workspaceLinks = role ? roleLinks[role] : roleLinks.user;
  const year = new Date().getFullYear();

  return (
    <footer className="border-t border-primary/10 bg-card/86 px-4 py-8 text-sm text-muted-foreground shadow-[0_-16px_40px_hsl(var(--hero-dark)/0.04)] backdrop-blur sm:px-5 md:px-6 lg:px-8">
      <div className="mx-auto grid w-full max-w-[1600px] gap-8 lg:grid-cols-[minmax(0,1.2fr)_minmax(0,0.9fr)_minmax(0,0.9fr)_minmax(0,0.9fr)_auto]">
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
            {t("footer.description")}
          </p>
          <div className="mt-4 flex flex-wrap gap-2">
            <FooterChip icon={Briefcase} label={t("nav.items.jobs")} />
            <FooterChip icon={Building2} label={t("nav.items.companies")} />
            <FooterChip icon={Search} label={t("nav.items.profiles")} />
          </div>
        </div>

        <FooterColumn title={t("footer.marketplace")} links={marketplaceLinks} />
        <FooterColumn
          title={t("footer.workspace")}
          links={[{ labelKey: "common.dashboard", path: dashboardPath }, ...workspaceLinks]}
        />
        <FooterColumn title={t("footer.information")} links={legalLinks} />

        <div className="min-w-0 lg:text-right">
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-primary">
            {t("common.platform")}
          </p>
          <div className="mt-3 flex flex-col gap-2 lg:items-end">
            <Link to="/settings" className="footer-link focus-ring">
              <Settings size={15} />
              {t("nav.items.settings")}
            </Link>
            <Link to="/profile" className="footer-link focus-ring">
              <User size={15} />
              {t("common.account")}
            </Link>
            <span className="footer-link cursor-default">
              <Code2 size={15} />
              JavaNC 2026
            </span>
          </div>
        </div>
      </div>

      <div className="mx-auto mt-7 flex w-full max-w-[1600px] flex-col gap-2 border-t border-border pt-4 text-xs sm:flex-row sm:items-center sm:justify-between">
        <span>{t("footer.copyright", { year })}</span>
        <span className="inline-flex items-center gap-2">
          <Layers3 size={14} className="text-primary" />
          {t("footer.tagline")}
        </span>
      </div>
    </footer>
  );
}

function FooterColumn({ title, links }: { title: string; links: FooterLink[] }) {
  const { t } = useTranslation();

  return (
    <nav aria-label={title}>
      <p className="text-xs font-semibold uppercase tracking-[0.14em] text-primary">
        {title}
      </p>
      <div className="mt-3 grid gap-2">
        {links.map((link) => (
          <Link
            key={`${title}-${link.path}-${link.labelKey}`}
            to={link.path}
            className="footer-link focus-ring"
          >
            {t(link.labelKey)}
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
