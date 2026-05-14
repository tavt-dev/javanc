import { NavLink, useLocation } from "react-router-dom";
import { cn } from "@/lib/utils";
import { getDashboardPath } from "@/routes/dashboard-path";
import { useAuthStore } from "@/stores/auth-store";
import { useUIStore } from "@/stores/ui-store";
import { ChevronLeft, LayoutDashboard } from "lucide-react";
import { useTranslation } from "react-i18next";
import {
  mainNavItems,
  type NavItem,
  visibleRoleNavItems,
} from "./navigation";

export function Sidebar() {
  const { t } = useTranslation();
  const user = useAuthStore((s) => s.user);
  const collapsed = useUIStore((s) => s.sidebarCollapsed);
  const toggleCollapsed = useUIStore((s) => s.toggleSidebarCollapsed);
  const location = useLocation();
  const role = user?.role;
  const dashboardPath = getDashboardPath(role);

  const visibleRoleItems = visibleRoleNavItems(role);

  return (
    <aside
      className={cn(
        "hidden lg:flex flex-col border-r border-primary/10 bg-card/95 backdrop-blur",
        "h-screen sticky top-0 shadow-sm transition-all duration-200 ease-out",
        collapsed ? "w-[68px]" : "w-[240px]",
      )}
    >
      {/* Logo */}
      <div className="h-16 flex items-center px-4 border-b border-border shrink-0">
        <div className="flex items-center gap-2 min-w-0">
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary shadow-sm ring-1 ring-primary/20">
            <span className="text-primary-foreground font-bold text-sm">J</span>
          </div>
          {!collapsed && (
            <span className="font-semibold text-foreground truncate">
              JavaNC
            </span>
          )}
        </div>
      </div>

      {/* Nav */}
      <nav className="premium-scrollbar flex-1 overflow-y-auto px-2 py-3">
        {!collapsed && (
          <p className="mb-2 px-3 text-[11px] font-semibold uppercase tracking-[0.12em] text-primary/70">
            {t("common.workspace")}
          </p>
        )}
        <SidebarLink
          item={{ labelKey: "common.dashboard", path: dashboardPath, icon: LayoutDashboard }}
          collapsed={collapsed}
          active={location.pathname === dashboardPath}
        />
        {mainNavItems.map((item) => (
          <SidebarLink
            key={item.path}
            item={item}
            collapsed={collapsed}
            active={location.pathname === item.path}
          />
        ))}

        {visibleRoleItems.length > 0 && (
          <>
            <div className="my-3 mx-2 border-t border-border" />
            {!collapsed && (
              <p className="mb-2 px-3 text-[11px] font-semibold uppercase tracking-[0.12em] text-primary/70">
                {t("common.roleTools")}
              </p>
            )}
            {visibleRoleItems.map((item) => (
              <SidebarLink
                key={item.path}
                item={item}
                collapsed={collapsed}
                active={location.pathname.startsWith(item.path)}
              />
            ))}
          </>
        )}
      </nav>

      {/* Collapse toggle */}
      <button
        type="button"
        onClick={toggleCollapsed}
        className="focus-ring flex h-12 items-center justify-center border-t border-border text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
        aria-label={collapsed ? t("nav.expandSidebar") : t("nav.collapseSidebar")}
      >
        <ChevronLeft
          size={18}
          className={cn(
            "transition-transform duration-200",
            collapsed && "rotate-180",
          )}
        />
      </button>
    </aside>
  );
}

function SidebarLink({
  item,
  collapsed,
  active,
}: {
  item: NavItem;
  collapsed: boolean;
  active: boolean;
}) {
  const { t } = useTranslation();
  const Icon = item.icon;
  const label = t(item.labelKey);
  return (
    <NavLink
      to={item.path}
      className={cn(
        "group relative flex items-center gap-3 rounded-md px-3 py-2.5 text-sm font-medium transition-colors",
        "hover:bg-accent hover:text-accent-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background",
        active
          ? "bg-primary/10 text-primary shadow-sm ring-1 ring-primary/15"
          : "text-muted-foreground",
        collapsed && "justify-center px-0",
      )}
      title={collapsed ? label : undefined}
    >
      {active && (
        <span className="absolute left-0 top-1/2 h-5 w-0.5 -translate-y-1/2 rounded-full bg-primary" />
      )}
      <span
        className={cn(
          "flex h-7 w-7 shrink-0 items-center justify-center rounded-md transition-colors",
          active ? "bg-primary/10" : "group-hover:bg-background/60",
        )}
      >
        {Icon && <Icon size={17} className="shrink-0" />}
      </span>
      {!collapsed && <span className="truncate">{label}</span>}
    </NavLink>
  );
}
