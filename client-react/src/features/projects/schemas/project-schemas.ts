import { z } from "zod";

const optionalTrimmed = (max: number, message: string) =>
  z
    .string()
    .trim()
    .max(max, message)
    .optional()
    .or(z.literal(""))
    .transform((value) => (value ? value : undefined));

export const projectSchema = z.object({
  title: z
    .string()
    .trim()
    .min(1, "Title is required")
    .min(2, "Title must be at least 2 characters")
    .max(160, "Title must be 160 characters or fewer"),
  description: optionalTrimmed(
    2000,
    "Description must be 2000 characters or fewer",
  ),
  url: z
    .string()
    .trim()
    .optional()
    .or(z.literal(""))
    .transform((value) => (value ? value : undefined))
    .refine((value) => !value || z.url().safeParse(value).success, {
      message: "Enter a valid URL",
    }),
  display: z.boolean(),
});

export type ProjectSchemaInput = z.input<typeof projectSchema>;
export type ProjectSchemaValues = z.infer<typeof projectSchema>;
