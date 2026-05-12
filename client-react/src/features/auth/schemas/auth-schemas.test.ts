import { describe, expect, it } from "vitest";
import {
  loginSchema,
  registerSchema,
  verifyEmailSchema,
} from "@/features/auth/schemas/auth-schemas";

describe("auth schemas", () => {
  it("accepts a valid login", () => {
    expect(
      loginSchema.safeParse({
        email: "user@example.com",
        password: "Password1",
      }).success,
    ).toBe(true);
  });

  it("rejects weak register passwords", () => {
    const result = registerSchema.safeParse({
      name: "User",
      email: "user@example.com",
      password: "password",
      confirmPassword: "password",
    });

    expect(result.success).toBe(false);
  });

  it("rejects mismatched confirmation passwords", () => {
    const result = registerSchema.safeParse({
      name: "User",
      email: "user@example.com",
      password: "Password1",
      confirmPassword: "Password2",
    });

    expect(result.success).toBe(false);
  });

  it("requires a 6-digit OTP", () => {
    expect(
      verifyEmailSchema.safeParse({
        email: "user@example.com",
        otp: "123456",
      }).success,
    ).toBe(true);
    expect(
      verifyEmailSchema.safeParse({
        email: "user@example.com",
        otp: "12345a",
      }).success,
    ).toBe(false);
  });
});
