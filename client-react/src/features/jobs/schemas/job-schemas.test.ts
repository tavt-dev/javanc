import { describe, expect, it } from "vitest";
import { jobSchema } from "./job-schemas";

describe("jobSchema", () => {
  it("accepts a valid job payload", () => {
    const result = jobSchema.safeParse({
      title: "Java API Engineer",
      description: "Build APIs",
      typeJob: "java",
      size: 2,
    });

    expect(result.success).toBe(true);
  });

  it("rejects missing title, invalid type, and invalid size", () => {
    expect(
      jobSchema.safeParse({
        title: "",
        description: "",
        typeJob: "ruby",
        size: 0,
      }).success,
    ).toBe(false);
  });
});
