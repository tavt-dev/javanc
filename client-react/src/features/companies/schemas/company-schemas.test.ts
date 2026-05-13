import { describe, expect, it } from "vitest";
import { companySchema } from "./company-schemas";

describe("companySchema", () => {
  it("accepts a valid company payload", () => {
    const result = companySchema.safeParse({
      name: "Acme Software",
      type: "Software",
      description: "Enterprise software",
      street: "1 Main St",
      email: "hello@acme.test",
      phone: "+1 555 111 2222",
      city: "New York",
      country: "USA",
    });

    expect(result.success).toBe(true);
  });

  it("rejects invalid email and phone", () => {
    const result = companySchema.safeParse({
      name: "Acme Software",
      email: "not-email",
      phone: "abc",
    });

    expect(result.success).toBe(false);
  });
});
