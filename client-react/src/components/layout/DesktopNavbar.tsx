import { NavLink, useLocation } from "react-router-dom";
import { cn } from "@/lib/utils";
import { useAuthStore } from "@/stores/auth-store";
import { getDashboardPath } from "@/routes/dashboard-path";
import type { Role } from "@/types/auth";

type NavItem = {
  label: string;
  path: string;
  roles?: Role[];
};

const primaryNav: NavItem[] = [
  { label: "Jobs", path: "/jobs" },
  { label: "Companies", path: "/companies" },
  { label: "Profiles", path: "/profiles" },
  { label: "Projects", path: "/projects" },
  { label: "Notifications", path: "/notifications" },
];

const roleNav: NavItem[] = [
  { label: "My Applications", path: "/my-applications", roles: ["user"] },
  { label: "Manage Jobs", path: "/hr/jobs", roles: ["hr"] },
  { label: "My Company", path: "/manager/company", roles: ["manager"] },
  { label: "Manage HR", path: "/manager/hr", roles: ["manager"] },
  { label: "User Management", path: "/admin/users", roles: ["admin"] },
  { label: "Company Mgmt", path: "/admin/companies", roles: ["admin"] },
];

export function DesktopNavbar() {
  const role = useAuthStore((state) => state.user?.role);
  const dashboardPath = getDashboardPath(role);
  const visibleRoleItems = roleNav.filter(
    (item) => role && item.roles?.includes(role),
  );

  return (
    <div className="hidden min-w-0 flex-1 items-center gap-5 lg:flex">
      <NavLink
        to={dashboardPath}
        className="focus-ring flex shrink-0 items-center gap-2 rounded-md"
        aria-label="JavaNC dashboard"
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
        aria-label="Primary navigation"
      >
        <DesktopNavLink item={{ label: "Dashboard", path: dashboardPath }} exact />
        {primaryNav.map((item) => (
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
      {item.label}
    </NavLink>
  );
}
