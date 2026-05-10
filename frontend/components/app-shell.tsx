"use client";

import Link from "next/link";
import { BriefcaseBusiness, Building2, Globe2, LayoutDashboard, LogOut, UserRound } from "lucide-react";
import { useAuth } from "@/features/auth/auth-provider";
import { useLanguage } from "@/lib/i18n";

const navItems = [
  { href: "/profiles", labelKey: "nav.profiles", icon: UserRound },
  { href: "/jobs", labelKey: "nav.jobs", icon: BriefcaseBusiness },
  { href: "/companies", labelKey: "nav.companies", icon: Building2 },
  { href: "/projects", labelKey: "nav.projects", icon: LayoutDashboard }
];

export function AppShell({ children }: { children: React.ReactNode }) {
  const { signedIn, user, logout } = useAuth();
  const { language, setLanguage, t } = useLanguage();

  return (
    <div className="flex min-h-screen flex-col bg-canvas">
      <header className="sticky top-0 z-30 border-b border-line bg-white/92 backdrop-blur">
        <div className="flex w-full items-center justify-between gap-4 px-4 py-3 sm:px-6 lg:px-8">
          <Link href="/" className="flex items-center gap-3">
            <span className="flex h-10 w-10 items-center justify-center rounded-md bg-ink text-sm font-bold text-white">
              JN
            </span>
            <span>
              <span className="block text-sm font-semibold text-ink">JavaNC</span>
              <span className="block text-xs text-muted">{t("shell.subtitle")}</span>
            </span>
          </Link>

          <nav className="hidden items-center gap-1 md:flex">
            {navItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="focus-ring flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium text-muted hover:bg-canvas hover:text-ink"
              >
                <item.icon className="h-4 w-4" />
                {t(item.labelKey)}
              </Link>
            ))}
            {signedIn ? (
              <>
                <Link
                  href="/admin/users"
                  className="focus-ring rounded-md px-3 py-2 text-sm font-medium text-muted hover:bg-canvas hover:text-ink"
                >
                  {t("nav.admin")}
                </Link>
                <Link
                  href="/manager/jobs"
                  className="focus-ring rounded-md px-3 py-2 text-sm font-medium text-muted hover:bg-canvas hover:text-ink"
                >
                  {t("nav.manager")}
                </Link>
              </>
            ) : null}
          </nav>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setLanguage(language === "en" ? "vi" : "en")}
              className="focus-ring inline-flex h-10 items-center gap-2 rounded-md border border-line bg-white px-3 text-sm font-semibold text-muted hover:text-ink"
              aria-label="Switch language"
            >
              <Globe2 className="h-4 w-4" />
              {language.toUpperCase()}
            </button>
            {signedIn ? (
              <>
                <Link href="/account" className="hidden text-right text-sm sm:block">
                  <span className="block font-semibold text-ink">{user?.name ?? t("nav.account")}</span>
                  <span className="block text-xs text-muted">{user?.role ?? "Signed in"}</span>
                </Link>
                <button
                  type="button"
                  onClick={logout}
                  className="focus-ring inline-flex h-10 w-10 items-center justify-center rounded-md border border-line bg-white text-muted hover:text-danger"
                  aria-label={t("nav.logout")}
                >
                  <LogOut className="h-4 w-4" />
                </button>
              </>
            ) : (
              <>
                <Link
                  href="/login"
                  className="focus-ring rounded-md px-3 py-2 text-sm font-semibold text-muted hover:text-ink"
                >
                  {t("nav.login")}
                </Link>
                <Link
                  href="/register"
                  className="focus-ring rounded-md bg-ink px-4 py-2 text-sm font-semibold text-white hover:bg-brand"
                >
                  {t("nav.register")}
                </Link>
              </>
            )}
          </div>
        </div>
        <nav className="flex gap-1 overflow-x-auto border-t border-line px-4 py-2 md:hidden">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="focus-ring flex shrink-0 items-center gap-2 rounded-md px-3 py-2 text-sm font-medium text-muted hover:bg-canvas hover:text-ink"
            >
              <item.icon className="h-4 w-4" />
              {t(item.labelKey)}
            </Link>
          ))}
        </nav>
      </header>
      <main className="animate-page w-full flex-1 px-4 py-6 sm:px-6 lg:px-8">{children}</main>
      <footer className="border-t border-line bg-white">
        <div className="grid w-full gap-6 px-4 py-6 text-sm sm:px-6 md:grid-cols-[1.5fr_1fr_1fr] lg:px-8">
          <div>
            <div className="flex items-center gap-3">
              <span className="flex h-9 w-9 items-center justify-center rounded-md bg-ink text-xs font-bold text-white">JN</span>
              <span className="font-semibold text-ink">JavaNC</span>
            </div>
            <p className="mt-3 max-w-2xl leading-6 text-muted">{t("footer.product")}</p>
          </div>
          <div>
            <p className="font-semibold text-ink">{t("footer.platform")}</p>
            <div className="mt-3 grid gap-2 text-muted">
              <Link href="/profiles">{t("nav.profiles")}</Link>
              <Link href="/projects">{t("nav.projects")}</Link>
              <Link href="/jobs">{t("nav.jobs")}</Link>
            </div>
          </div>
          <div>
            <p className="font-semibold text-ink">{t("footer.operations")}</p>
            <div className="mt-3 grid gap-2 text-muted">
              <Link href="/admin/users">{t("nav.admin")}</Link>
              <Link href="/manager/jobs">{t("nav.manager")}</Link>
              <Link href="/companies">{t("nav.companies")}</Link>
            </div>
          </div>
        </div>
        <div className="border-t border-line px-4 py-3 text-xs text-muted sm:px-6 lg:px-8">{t("footer.rights")}</div>
      </footer>
    </div>
  );
}
