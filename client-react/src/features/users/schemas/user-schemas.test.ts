import { describe, expect, it } from "vitest";
import {
  changeUserRoleSchema,
  changeUserStatusSchema,
  createInternalAccountSchema,
  updateUserSchema,
} from "./user-schemas";

describe("user schemas", () => {
  it("accepts valid internal account creation", () => {
    const result = createInternalAccountSchema.safeParse({
      name: "Jane Admin",
      email: "jane@example.com",
      employeeId: "EMP-1",
      password: "Password1",
      confirmPassword: "Password1",
      role: "admin",
    });

    expect(result.success).toBe(true);
  });

  it("rejects weak password and confirm mismatch", () => {
    const result = createInternalAccountSchema.safeParse({
      name: "Jane Admin",
      email: "jane@example.com",
      password: "password",
      confirmPassword: "different",
      role: "admin",
    });

    expect(result.success).toBe(false);
  });

  it("validates update, role, and status payloads", () => {
    expect(
      updateUserSchema.safeParse({
        name: "Jane",
        email: "jane@example.com",
        password: "",
        active: true,
      }).success,
    ).toBe(true);
    expect(changeUserRoleSchema.safeParse({ role: "hr" }).success).toBe(true);
    expect(changeUserRoleSchema.safeParse({ role: "owner" }).success).toBe(false);
    expect(
      changeUserStatusSchema.safeParse({ active: false, status: "DISABLED" })
        .success,
    ).toBe(true);
  });
});
