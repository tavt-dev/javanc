import {
  Bell,
  Briefcase,
  Building,
  Building2,
  ClipboardList,
  FileEdit,
  FolderKanban,
  Search,
  Settings,
  User,
  UserPlus,
  Users,
} from "lucide-react";
import type { ElementType } from "react";
import type { Role } from "@/types/auth";

export type NavItem = {
  labelKey: string;
  path: string;
  icon?: ElementType;
  roles?: Role[];
};

export const mainNavItems: NavItem[] = [
  { labelKey: "nav.items.profile", path: "/profile", icon: User },
  { labelKey: "nav.items.profiles", path: "/profiles", icon: Search },
  { labelKey: "nav.items.projects", path: "/projects", icon: FolderKanban },
  { labelKey: "nav.items.notifications", path: "/notifications", icon: Bell },
  { labelKey: "nav.items.companies", path: "/companies", icon: Building2 },
  { labelKey: "nav.items.jobs", path: "/jobs", icon: Briefcase },
  { labelKey: "nav.items.settings", path: "/settings", icon: Settings },
];

export const primaryNavItems: NavItem[] = [
  { labelKey: "nav.items.jobs", path: "/jobs" },
  { labelKey: "nav.items.companies", path: "/companies" },
  { labelKey: "nav.items.profiles", path: "/profiles" },
  { labelKey: "nav.items.projects", path: "/projects" },
  { labelKey: "nav.items.notifications", path: "/notifications" },
];

export const roleNavItems: NavItem[] = [
  {
    labelKey: "nav.items.applications",
    path: "/my-applications",
    icon: ClipboardList,
    roles: ["user"],
  },
  {
    labelKey: "nav.items.manageJobs",
    path: "/hr/jobs",
    icon: FileEdit,
    roles: ["hr"],
  },
  {
    labelKey: "nav.items.company",
    path: "/manager/company",
    icon: Building,
    roles: ["manager"],
  },
  {
    labelKey: "nav.items.manageHr",
    path: "/manager/hr",
    icon: UserPlus,
    roles: ["manager"],
  },
  {
    labelKey: "nav.items.users",
    path: "/admin/users",
    icon: Users,
    roles: ["admin"],
  },
  {
    labelKey: "nav.items.companyManagement",
    path: "/admin/companies",
    icon: Building2,
    roles: ["admin"],
  },
];

export function visibleRoleNavItems(role?: Role) {
  return roleNavItems.filter((item) => role && item.roles?.includes(role));
}
