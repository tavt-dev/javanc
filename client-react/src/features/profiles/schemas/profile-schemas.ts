import { z } from "zod";

const optionalTrimmed = (max: number, message: string) =>
  z
    .string()
    .trim()
    .max(max, message)
    .optional()
    .or(z.literal(""))
    .transform((value) => (value ? value : undefined));

export const typeProfileSchema = z.enum(["JAVA", "PYTHON", "C"]);

export const profileSchema = z.object({
  title: z
    .string()
    .trim()
    .min(1, "Title is required")
    .min(2, "Title must be at least 2 characters")
    .max(120, "Title must be 120 characters or fewer"),
  typeProfile: typeProfileSchema,
  objective: optionalTrimmed(2000, "Objective must be 2000 characters or fewer"),
  education: optionalTrimmed(2000, "Education must be 2000 characters or fewer"),
  workExperience: optionalTrimmed(
    2000,
    "Work experience must be 2000 characters or fewer",
  ),
  skills: optionalTrimmed(2000, "Skills must be 2000 characters or fewer"),
  contact: z.object({
    address: optionalTrimmed(255, "Address must be 255 characters or fewer"),
    phone: z
      .string()
      .trim()
      .optional()
      .or(z.literal(""))
      .transform((value) => (value ? value : undefined))
      .refine(
        (value) => !value || /^[0-9+() .-]{7,32}$/.test(value),
        "Enter a valid phone number",
      ),
    email: z
      .string()
      .trim()
      .optional()
      .or(z.literal(""))
      .transform((value) => (value ? value : undefined))
      .refine(
        (value) => !value || /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(value),
        "Enter a valid contact email",
      ),
  }),
});

export type ProfileSchemaInput = z.input<typeof profileSchema>;
export type ProfileSchemaValues = z.infer<typeof profileSchema>;
