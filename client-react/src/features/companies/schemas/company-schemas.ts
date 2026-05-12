import { z } from "zod";

export const companySchema = z.object({
  name: z.string().trim().min(2, "Name must be at least 2 characters").max(160),
  type: z.string().trim().max(80).optional().or(z.literal("")),
  description: z.string().trim().max(2000).optional().or(z.literal("")),
  street: z.string().trim().max(160).optional().or(z.literal("")),
  email: z.string().trim().email("Enter a valid email").optional().or(z.literal("")),
  phone: z
    .string()
    .trim()
    .regex(/^[0-9+() .-]{7,32}$/, "Enter a valid phone number")
    .optional()
    .or(z.literal("")),
  city: z.string().trim().max(120).optional().or(z.literal("")),
  country: z.string().trim().max(120).optional().or(z.literal("")),
  image: z
    .custom<FileList>()
    .optional()
    .refine(
      (files) =>
        !files || files.length === 0 || (files[0]?.size ?? 0) <= 2 * 1024 * 1024,
      "Image must be 2MB or smaller",
    )
    .refine(
      (files) =>
        !files ||
        files.length === 0 ||
        ["image/png", "image/jpeg", "image/webp"].includes(files[0]?.type ?? ""),
      "Use PNG, JPG, or WebP",
    ),
});

export type CompanySchemaValues = z.infer<typeof companySchema>;
