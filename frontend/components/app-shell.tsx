"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { Bell, BriefcaseBusiness, Building2, ChevronDown, Globe2, IdCard, LayoutDashboard, LogOut, ShieldCheck, Trash2, UserCircle, UserRound } from "lucide-react";
import { useAuth } from "@/features/auth/auth-provider";
import { useLanguage } from "@/lib/i18n";
import { notificationApi } from "@/lib/api";
import { useApi } from "@/lib/use-api";

const navItems = [
  { href: "/profiles", labelKey: "nav.profiles", icon: UserRound },
  { href: "/jobs", labelKey: "nav.jobs", icon: BriefcaseBusiness },
  { href: "/companies", labelKey: "nav.companies", icon: Building2 },
  { href: "/projects", labelKey: "nav.projects", icon: LayoutDashboard }
];

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { activeAccountKey, savedAccounts, signedIn, switchAccount, user, logout, removeSavedAccount } = useAuth();
  const { language, setLanguage, t } = useLanguage();
  const [notificationReadVersion, setNotificationReadVersion] = useState(0);
  const notifications = useApi(() => (signedIn && user?.id ? notificationApi.byUser(user.id).catch(() => []) : Promise.resolve([])), [signedIn, user?.id, notificationReadVersion, pathname]);
  const unreadCount = pathname.startsWith("/account/invitations") ? 0 : notifications.data?.filter((item) => !item.read).length ?? 0;
  const role = user?.role?.toLowerCase();
  const showAdmin = signedIn && role === "admin";
  const showManager = signedIn && (role === "manager" || role === "hr");
  const [accountMenuOpen, setAccountMenuOpen] = useState(false);
  const [accountSwitchError, setAccountSwitchError] = useState<string | null>(null);
  const accountMenuRef = useRef<HTMLDivElement | null>(null);
  const isActive = (href: string) => pathname === href || pathname.startsWith(`${href}/`);
  const navClass = (href: string) =>
    `focus-ring relative flex items-center gap-2 rounded-md px-3 py-2 text-sm font-semibold transition ${
      isActive(href)
        ? "bg-white/10 text-white shadow-sm ring-1 ring-accent/40"
        : "text-white/70 hover:bg-white/10 hover:text-white"
    }`;

  useEffect(() => {
    if (!accountMenuOpen) {
      setAccountSwitchError(null);
      return;
    }

    function handlePointerDown(event: PointerEvent) {
      if (!accountMenuRef.current?.contains(event.target as Node)) {
        setAccountMenuOpen(false);
      }
    }

    document.addEventListener("pointerdown", handlePointerDown);
    return () => document.removeEventListener("pointerdown", handlePointerDown);
  }, [accountMenuOpen]);

  useEffect(() => {
    function handleNotificationsRead() {
      setNotificationReadVersion((current) => current + 1);
    }

    window.addEventListener("notifications-read", handleNotificationsRead);
    return () => window.removeEventListener("notifications-read", handleNotificationsRead);
  }, []);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("is-visible");
            observer.unobserve(entry.target);
          }
        });
      },
      { rootMargin: "0px 0px -8% 0px", threshold: 0.12 }
    );

    const observed = new WeakSet<Element>();
    function observeReveals() {
      document.querySelectorAll<HTMLElement>(".scroll-reveal").forEach((item) => {
        if (!observed.has(item)) {
          observed.add(item);
          observer.observe(item);
        }
      });
    }

    observeReveals();
    const mutationObserver = new MutationObserver(observeReveals);
    mutationObserver.observe(document.body, { childList: true, subtree: true });

    return () => {
      mutationObserver.disconnect();
      observer.disconnect();
    };
  }, [pathname]);

  return (
    <div className="flex min-h-screen flex-col">
      <header className="sticky top-0 z-30 border-b border-white/10 bg-[#201b52]/80 shadow-sm backdrop-blur">
        <div className="flex w-full items-center justify-between gap-4 px-4 py-3 sm:px-6 lg:px-8">
          <Link href="/" className="flex items-center gap-3">
            <span className="flex h-10 w-10 items-center justify-center rounded-md bg-accent text-sm font-bold text-ink">
              JN
            </span>
            <span>
              <span className="block font-serif text-lg font-bold text-white">JavaNC</span>
              <span className="block text-xs text-white/60">{t("shell.subtitle")}</span>
            </span>
          </Link>

          <nav className="hidden items-center gap-1 md:flex">
            {navItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={navClass(item.href)}
                aria-current={isActive(item.href) ? "page" : undefined}
              >
                <item.icon className="h-4 w-4" />
                {t(item.labelKey)}
              </Link>
            ))}
            {showAdmin ? (
                <Link
                  href="/admin/users"
                  className={navClass("/admin")}
                  aria-current={isActive("/admin") ? "page" : undefined}
                >
                  {t("nav.admin")}
                </Link>
            ) : null}
            {showManager ? (
                <Link
                  href="/manager/jobs"
                  className={navClass("/manager")}
                  aria-current={isActive("/manager") ? "page" : undefined}
                >
                  {t("nav.manager")}
                </Link>
            ) : null}
          </nav>

          <div className="flex items-center gap-2">
            <div className="inline-flex h-10 items-center rounded-md border border-white/15 bg-white/10 p-1">
              <Globe2 className="h-4 w-4 text-white/70" />
              {(["en", "vi"] as const).map((item) => (
                <button
                  key={item}
                  type="button"
                  onClick={() => setLanguage(item)}
                  className={`focus-ring pressable ml-1 rounded px-2 py-1 text-xs font-bold transition duration-200 ${
                    language === item ? "scale-105 bg-accent text-ink shadow-sm" : "text-white/70 hover:text-white"
                  }`}
                  aria-pressed={language === item}
                >
                  {item.toUpperCase()}
                </button>
              ))}
            </div>
            {signedIn ? (
              <div className="relative" ref={accountMenuRef}>
                <button
                  type="button"
                  onClick={() => {
                    setAccountSwitchError(null);
                    setAccountMenuOpen((open) => !open);
                  }}
                  className="focus-ring pressable inline-flex min-h-10 items-center gap-2 rounded-full border border-white/15 bg-white/10 px-2 pl-3 text-white hover:bg-white/15"
                  aria-expanded={accountMenuOpen}
                  aria-haspopup="menu"
                >
                  <span className="flex h-6 w-6 items-center justify-center rounded-full bg-accent text-xs font-bold text-ink">
                    {(user?.name || user?.email || "U").slice(0, 1).toUpperCase()}
                  </span>
                  <span className="hidden min-w-0 sm:block">
                    <span className="block max-w-[140px] truncate text-left text-sm font-semibold">{user?.name ?? t("nav.account")}</span>
                    <span className={`mt-0.5 inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-bold uppercase leading-none ${roleBadgeClass(role)}`}>
                      <ShieldCheck className="h-3 w-3" />
                      {roleLabel(role, t)}
                    </span>
                  </span>
                  <ChevronDown className={`h-4 w-4 text-white/70 transition ${accountMenuOpen ? "rotate-180" : ""}`} />
                </button>
                {accountMenuOpen ? (
                  <div
                    role="menu"
                    className="absolute right-0 top-12 z-50 w-72 overflow-hidden rounded-md border border-line bg-white text-ink shadow-soft"
                  >
                    <div className="border-b border-line p-4">
                      <p className="truncate text-sm font-bold">{user?.name ?? t("account.current")}</p>
                      <p className="mt-1 truncate text-xs text-muted">{user?.email}</p>
                      <p className={`mt-2 inline-flex items-center gap-1 rounded-full px-2 py-1 text-xs font-semibold ${roleBadgeClass(role)}`}>
                        <ShieldCheck className="h-3.5 w-3.5" />
                        {roleLabel(role, t)}
                      </p>
                    </div>
                    <div className="grid p-2 text-sm font-semibold">
                      <Link className="pressable flex items-center justify-between rounded-md px-3 py-2 hover:bg-slate-50" href="/account/invitations" onClick={() => setAccountMenuOpen(false)}>
                        <span className="inline-flex items-center gap-2">
                          <Bell className="h-4 w-4" />
                          {t("nav.notifications")}
                        </span>
                        {unreadCount ? <span className="rounded-full bg-accent px-2 py-0.5 text-xs text-ink">{unreadCount}</span> : null}
                      </Link>
                      <Link className="pressable inline-flex items-center gap-2 rounded-md px-3 py-2 hover:bg-slate-50" href="/account" onClick={() => setAccountMenuOpen(false)}>
                        <IdCard className="h-4 w-4" />
                        {t("nav.account")}
                      </Link>
                      <Link className="pressable inline-flex items-center gap-2 rounded-md px-3 py-2 hover:bg-slate-50" href="/profile/edit" onClick={() => setAccountMenuOpen(false)}>
                        <UserCircle className="h-4 w-4" />
                        {t("nav.profile")}
                      </Link>
                    </div>
                    {savedAccounts.length ? (
                      <div className="border-t border-line p-2">
                        <p className="px-3 py-2 text-xs font-bold uppercase tracking-wide text-muted">{t("account.switch")}</p>
                        {accountSwitchError ? (
                          <div className="mx-3 mb-2 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-xs font-semibold text-danger">
                            {accountSwitchError}
                          </div>
                        ) : null}
                        {savedAccounts.map((account) => (
                          <div
                            key={account.key}
                            className={`flex items-center gap-1 rounded-md ${
                              activeAccountKey === account.key ? "bg-indigo-50 text-brand" : "text-ink"
                            }`}
                          >
                            <button
                              type="button"
                              className="pressable min-w-0 flex-1 px-3 py-2 text-left text-sm hover:bg-slate-50"
                              onClick={() => {
                                setAccountSwitchError(null);
                                void switchAccount(account.key)
                                  .then(() => setAccountMenuOpen(false))
                                  .catch((err) => {
                                    setAccountSwitchError(err instanceof Error ? err.message : t("auth.unableSavedSignIn"));
                                  });
                              }}
                            >
                              <span className="flex min-w-0 items-center justify-between gap-2">
                                  <span className="min-w-0">
                                    <span className="block truncate font-semibold">{account.label}</span>
                                  <span className="block truncate text-xs text-muted">{account.email ?? roleLabel(account.role, t)}</span>
                                  {account.role ? (
                                    <span className={`mt-1 inline-flex rounded-full px-2 py-0.5 text-[10px] font-bold uppercase ${roleBadgeClass(account.role)}`}>
                                      {roleLabel(account.role, t)}
                                    </span>
                                  ) : null}
                                  </span>
                                {activeAccountKey === account.key ? <span className="shrink-0 text-xs font-bold text-emerald-600">{t("account.active")}</span> : null}
                              </span>
                            </button>
                            <button
                              type="button"
                              className="focus-ring pressable mr-1 flex h-8 w-8 shrink-0 items-center justify-center rounded-md text-danger hover:bg-red-50"
                              aria-label={`${t("account.removeSaved")} ${account.label}`}
                              title={t("account.removeSaved")}
                              onClick={() => removeSavedAccount(account.key)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </div>
                        ))}
                      </div>
                    ) : null}
                    <div className="border-t border-line p-2">
                      <button
                        type="button"
                        className="pressable flex w-full items-center gap-2 rounded-md px-3 py-2 text-sm font-semibold text-danger hover:bg-red-50"
                        onClick={() => {
                          setAccountMenuOpen(false);
                          logout();
                        }}
                      >
                        <LogOut className="h-4 w-4" />
                        {t("nav.logout")}
                      </button>
                    </div>
                  </div>
                ) : null}
              </div>
            ) : (
              <>
                <Link
                  href="/login"
                  className="focus-ring rounded-md px-3 py-2 text-sm font-semibold text-white/75 hover:text-white"
                >
                  {t("nav.login")}
                </Link>
                <Link
                  href="/register"
                  className="focus-ring rounded-full bg-accent px-5 py-2 text-sm font-semibold text-ink hover:bg-yellow-300"
                >
                  {t("nav.register")}
                </Link>
              </>
            )}
          </div>
        </div>
        <nav className="flex gap-1 overflow-x-auto border-t border-white/10 px-4 py-2 md:hidden">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={`${navClass(item.href)} shrink-0`}
              aria-current={isActive(item.href) ? "page" : undefined}
            >
              <item.icon className="h-4 w-4" />
              {t(item.labelKey)}
            </Link>
          ))}
        </nav>
      </header>
      <main className="animate-page w-full flex-1 px-4 py-6 sm:px-6 lg:px-8">{children}</main>
      <footer className="border-t border-white/10 bg-[#0f112e]/80 text-white">
        <div className="grid w-full gap-6 px-4 py-6 text-sm sm:px-6 md:grid-cols-[1.5fr_1fr_1fr] lg:px-8">
          <div>
            <div className="flex items-center gap-3">
              <span className="flex h-9 w-9 items-center justify-center rounded-md bg-accent text-xs font-bold text-ink">JN</span>
              <span className="font-semibold text-white">JavaNC</span>
            </div>
            <p className="mt-3 max-w-2xl leading-6 text-white/60">{t("footer.product")}</p>
          </div>
          <div>
            <p className="font-semibold text-white">{t("footer.platform")}</p>
            <div className="mt-3 grid gap-2 text-white/60">
              <Link href="/profiles">{t("nav.profiles")}</Link>
              <Link href="/projects">{t("nav.projects")}</Link>
              <Link href="/jobs">{t("nav.jobs")}</Link>
            </div>
          </div>
          <div>
            <p className="font-semibold text-white">{t("footer.operations")}</p>
            <div className="mt-3 grid gap-2 text-white/60">
              {showAdmin ? <Link href="/admin/users">{t("nav.admin")}</Link> : null}
              {showManager ? <Link href="/manager/jobs">{t("nav.manager")}</Link> : null}
              <Link href="/companies">{t("nav.companies")}</Link>
            </div>
          </div>
        </div>
        <div className="border-t border-white/10 px-4 py-3 text-xs text-white/50 sm:px-6 lg:px-8">{t("footer.rights")}</div>
      </footer>
    </div>
  );
}

function roleLabel(role: string | undefined | null, t: (key: string) => string) {
  const normalized = role?.toLowerCase();
  if (normalized === "admin") {
    return t("account.systemAdmin");
  }
  if (normalized === "manager") {
    return t("auth.managerRole");
  }
  if (normalized === "hr") {
    return t("auth.hrRole");
  }
  return t("auth.userRole");
}

function roleBadgeClass(role: string | undefined | null) {
  switch (role?.toLowerCase()) {
    case "admin":
      return "bg-red-50 text-red-700 ring-1 ring-red-200";
    case "manager":
      return "bg-amber-50 text-amber-800 ring-1 ring-amber-200";
    case "hr":
      return "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200";
    default:
      return "bg-indigo-50 text-brand ring-1 ring-indigo-200";
  }
}
