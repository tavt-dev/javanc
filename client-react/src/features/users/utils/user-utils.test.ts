import { describe, expect, it } from "vitest";
import { canDeactivateUser, filterUsers } from "./user-utils";
import type { AdminUserDTO } from "@/types/user";

const users: AdminUserDTO[] = [
  {
    id: 1,
    name: "Alice Admin",
    email: "alice@example.com",
    role: "admin",
    active: true,
  },
  {
    id: 2,
    name: "Henry HR",
    email: "hr@example.com",
    idEmployee: "HR-1",
    role: "hr",
    active: false,
  },
];

describe("user-utils", () => {
  it("filters users by search, role, and active state", () => {
    expect(
      filterUsers(users, { search: "hr-1", role: "hr", active: "inactive" }),
    ).toEqual([users[1]]);
  });

  it("blocks self deactivation", () => {
    expect(canDeactivateUser(users[0]!, 1)).toBe(false);
    expect(canDeactivateUser(users[1]!, 1)).toBe(true);
  });
});
