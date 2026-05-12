import { z } from "zod";

export const jobSchema = z.object({
  title: z.string().trim().min(2, "Title must be at least 2 characters").max(160),
  description: z.string().trim().max(2000).optional().or(z.literal("")),
  typeJob: z.enum(["java", "python", "php"]),
  size: z.number().int().min(1, "Openings must be at least 1"),
});

export type JobSchemaValues = z.infer<typeof jobSchema>;
