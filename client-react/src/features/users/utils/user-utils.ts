import type { Role } from "@/types/auth";
import type { AdminUserDTO } from "@/types/user";

export function filterUsers(
  users: AdminUserDTO[],
  filters: { search: string; role: "all" | Role; active: "all" | "active" | "inactive" },
) {
  const term = filters.search.trim().toLowerCase();
  return users.filter((user) => {
    const matchesTerm =
      !term ||
      [user.name, user.email, user.idEmployee]
        .filter(Boolean)
        .some((value) => String(value).toLowerCase().includes(term));
    const matchesRole = filters.role === "all" || user.role === filters.role;
    const matchesActive =
      filters.active === "all" ||
      (filters.active === "active" ? user.active : !user.active);
    return matchesTerm && matchesRole && matchesActive;
  });
}

export function canDeactivateUser(user: AdminUserDTO, currentUserId?: number) {
  return user.id !== currentUserId;
}
