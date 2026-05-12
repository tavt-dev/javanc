import { describe, expect, it } from "vitest";
import { profileSchema } from "./profile-schemas";

describe("profileSchema", () => {
  it("accepts and trims a valid profile", () => {
    const result = profileSchema.parse({
      title: "  Senior Java Developer  ",
      typeProfile: "JAVA",
      objective: "  Build reliable systems  ",
      education: "",
      workExperience: "Quarkus and React",
      skills: "Java, SQL",
      contact: {
        address: "  Hanoi  ",
        phone: "+84 123 456 789",
        email: "dev@example.com",
      },
    });

    expect(result.title).toBe("Senior Java Developer");
    expect(result.objective).toBe("Build reliable systems");
    expect(result.education).toBeUndefined();
    expect(result.contact.address).toBe("Hanoi");
  });

  it("rejects missing title and invalid profile type", () => {
    const result = profileSchema.safeParse({
      title: "",
      typeProfile: "GO",
      contact: {},
    });

    expect(result.success).toBe(false);
  });

  it("rejects invalid contact fields", () => {
    const result = profileSchema.safeParse({
      title: "Backend Developer",
      typeProfile: "JAVA",
      contact: {
        email: "not-email",
        phone: "abc",
      },
    });

    expect(result.success).toBe(false);
  });
});
