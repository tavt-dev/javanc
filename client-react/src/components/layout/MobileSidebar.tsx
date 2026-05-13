import { NavLink, useLocation } from "react-router-dom";
import { cn } from "@/lib/utils";
import { useAuthStore } from "@/stores/auth-store";
import { useUIStore } from "@/stores/ui-store";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { useEffect } from "react";
import {
  LayoutDashboard,
  User,
  Search,
  FolderKanban,
  Bell,
  Building2,
  Briefcase,
  Settings,
  ClipboardList,
  FileEdit,
  Users,
  UserPlus,
  Building,
  X,
} from "lucide-react";
import type { Role } from "@/types/auth";

interface NavItem {
  label: string;
  path: string;
  icon: React.ElementType;
  roles?: Role[];
}

const navItems: NavItem[] = [
  { label: "Dashboard", path: "/dashboard", icon: LayoutDashboard },
  { label: "My Profile", path: "/profile", icon: User },
  { label: "Profiles", path: "/profiles", icon: Search },
  { label: "My Projects", path: "/projects", icon: FolderKanban },
  { label: "Notifications", path: "/notifications", icon: Bell },
  { label: "Companies", path: "/companies", icon: Building2 },
  { label: "Job Board", path: "/jobs", icon: Briefcase },
  { label: "Settings", path: "/settings", icon: Settings },
];

const roleNavItems: NavItem[] = [
  { label: "My Applications", path: "/my-applications", icon: ClipboardList, roles: ["user"] },
  { label: "Manage Jobs", path: "/hr/jobs", icon: FileEdit, roles: ["hr"] },
  { label: "My Company", path: "/manager/company", icon: Building, roles: ["manager"] },
  { label: "Manage HR", path: "/manager/hr", icon: UserPlus, roles: ["manager"] },
  { label: "User Management", path: "/admin/users", icon: Users, roles: ["admin"] },
  { label: "Company Mgmt", path: "/admin/companies", icon: Building2, roles: ["admin"] },
];

export function MobileSidebar() {
  const isOpen = useUIStore((s) => s.sidebarOpen);
  const close = useUIStore((s) => s.closeSidebar);
  const user = useAuthStore((s) => s.user);
  const location = useLocation();
  const role = user?.role;
  const reduceMotion = useReducedMotion();

  useEffect(() => {
    if (!isOpen) return;

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") close();
    }

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [close, isOpen]);

  const visibleRoleItems = roleNavItems.filter(
    (item) => role && item.roles?.includes(role),
  );

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            className="fixed inset-0 z-40 bg-black/45 backdrop-blur-[2px] lg:hidden"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: reduceMotion ? 0 : 0.15 }}
            onClick={close}
          />

          {/* Drawer */}
          <motion.aside
            className="fixed inset-y-0 left-0 z-50 flex w-[min(300px,calc(100vw-2rem))] flex-col border-r border-primary/10 bg-card shadow-2xl lg:hidden"
            role="dialog"
            aria-modal="true"
            aria-label="Navigation menu"
            initial={reduceMotion ? { opacity: 1 } : { x: "-100%" }}
            animate={{ x: 0 }}
            exit={reduceMotion ? { opacity: 1 } : { x: "-100%" }}
            transition={
              reduceMotion
                ? { duration: 0 }
                : { type: "spring", stiffness: 300, damping: 30 }
            }
          >
            {/* Header */}
            <div className="flex h-16 items-center justify-between border-b border-border px-4">
              <div className="flex items-center gap-2">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary shadow-sm ring-1 ring-primary/20">
                  <span className="text-primary-foreground font-bold text-sm">J</span>
                </div>
                <span className="font-semibold">JavaNC</span>
              </div>
              <button
                type="button"
                onClick={close}
                className="icon-button focus-ring"
                aria-label="Close menu"
              >
                <X size={18} />
              </button>
            </div>

            {/* Nav */}
            <nav className="premium-scrollbar flex-1 overflow-y-auto px-2 py-3">
              <p className="mb-2 px-3 text-[11px] font-semibold uppercase tracking-[0.12em] text-primary/70">
                Workspace
              </p>
              {navItems.map((item) => {
                const Icon = item.icon;
                const active = location.pathname === item.path;
                return (
                  <NavLink
                    key={item.path}
                    to={item.path}
                    onClick={close}
                    className={cn(
                      "relative flex min-h-11 items-center gap-3 rounded-md px-3 py-2.5 text-sm font-medium transition-colors",
                      "hover:bg-accent hover:text-accent-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background",
                      active
                        ? "bg-primary/10 text-primary shadow-sm ring-1 ring-primary/10"
                        : "text-muted-foreground",
                    )}
                  >
                    {active && (
                      <span className="absolute left-0 top-1/2 h-5 w-0.5 -translate-y-1/2 rounded-full bg-primary" />
                    )}
                    <Icon size={18} />
                    <span>{item.label}</span>
                  </NavLink>
                );
              })}

              {visibleRoleItems.length > 0 && (
                <>
                  <div className="my-3 mx-2 border-t border-border" />
                  <p className="mb-2 px-3 text-[11px] font-semibold uppercase tracking-[0.12em] text-primary/70">
                    Role tools
                  </p>
                  {visibleRoleItems.map((item) => {
                    const Icon = item.icon;
                    const active = location.pathname.startsWith(item.path);
                    return (
                      <NavLink
                        key={item.path}
                        to={item.path}
                        onClick={close}
                        className={cn(
                          "relative flex min-h-11 items-center gap-3 rounded-md px-3 py-2.5 text-sm font-medium transition-colors",
                          "hover:bg-accent hover:text-accent-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background",
                          active
                            ? "bg-primary/10 text-primary shadow-sm ring-1 ring-primary/10"
                            : "text-muted-foreground",
                        )}
                      >
                        {active && (
                          <span className="absolute left-0 top-1/2 h-5 w-0.5 -translate-y-1/2 rounded-full bg-primary" />
                        )}
                        <Icon size={18} />
                        <span>{item.label}</span>
                      </NavLink>
                    );
                  })}
                </>
              )}
            </nav>
          </motion.aside>
        </>
      )}
    </AnimatePresence>
  );
}
