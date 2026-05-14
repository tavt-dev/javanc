import { NavLink, useLocation } from "react-router-dom";
import { cn } from "@/lib/utils";
import { useAuthStore } from "@/stores/auth-store";
import { getDashboardPath } from "@/routes/dashboard-path";
import { useTranslation } from "react-i18next";
import {
  primaryNavItems,
  type NavItem,
  visibleRoleNavItems,
} from "./navigation";

export function DesktopNavbar() {
  const { t } = useTranslation();
  const role = useAuthStore((state) => state.user?.role);
  const dashboardPath = getDashboardPath(role);
  const visibleRoleItems = visibleRoleNavItems(role);

  return (
    <div className="hidden min-w-0 flex-1 items-center gap-5 lg:flex">
      <NavLink
        to={dashboardPath}
        className="focus-ring flex shrink-0 items-center gap-2 rounded-md"
        aria-label={t("nav.dashboardAria")}
      >
        <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary text-sm font-bold text-primary-foreground shadow-sm ring-1 ring-primary/20">
          J
        </span>
        <span className="font-display text-base font-semibold tracking-tight text-foreground">
          JavaNC
        </span>
      </NavLink>

      <nav
        className="flex min-w-0 flex-1 items-center gap-1 overflow-x-auto premium-scrollbar"
        aria-label={t("nav.primary")}
      >
        <DesktopNavLink item={{ labelKey: "common.dashboard", path: dashboardPath }} exact />
        {primaryNavItems.map((item) => (
          <DesktopNavLink key={item.path} item={item} />
        ))}
        {visibleRoleItems.length > 0 && (
          <>
            <span className="mx-1 h-6 w-px shrink-0 bg-border" />
            {visibleRoleItems.map((item) => (
              <DesktopNavLink key={item.path} item={item} />
            ))}
          </>
        )}
      </nav>
    </div>
  );
}

function DesktopNavLink({ item, exact = false }: { item: NavItem; exact?: boolean }) {
  const { t } = useTranslation();
  const location = useLocation();
  const active =
    exact
      ? location.pathname === item.path
      : location.pathname.startsWith(item.path);

  return (
    <NavLink
      to={item.path}
      className={cn(
        "horizontal-nav-link focus-ring",
        active && "horizontal-nav-link-active",
      )}
    >
      {t(item.labelKey)}
    </NavLink>
  );
}
