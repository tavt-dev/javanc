import { describe, expect, it } from "vitest";
import { projectSchema } from "./project-schemas";

describe("projectSchema", () => {
  it("accepts a valid project and normalizes empty URL", () => {
    const result = projectSchema.parse({
      title: "  Hiring Platform  ",
      description: "",
      url: "",
      display: true,
    });

    expect(result.title).toBe("Hiring Platform");
    expect(result.description).toBeUndefined();
    expect(result.url).toBeUndefined();
  });

  it("rejects short title and invalid URL", () => {
    const result = projectSchema.safeParse({
      title: "A",
      description: "Demo",
      url: "invalid-url",
      display: true,
    });

    expect(result.success).toBe(false);
  });
});
