import type { Role } from "@/types/auth";

const dashboardPaths: Record<Role, string> = {
  user: "/user/dashboard",
  hr: "/hr/dashboard",
  manager: "/manager/dashboard",
  admin: "/admin/dashboard",
};

export function getDashboardPath(role?: Role | null) {
  return role ? dashboardPaths[role] : "/user/dashboard";
}
