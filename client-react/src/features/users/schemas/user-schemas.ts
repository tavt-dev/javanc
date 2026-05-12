import { z } from "zod";

const roleSchema = z.enum(["admin", "user", "hr", "manager"]);
const passwordSchema = z
  .string()
  .min(8, "Password must be at least 8 characters")
  .regex(/[A-Z]/, "Password needs an uppercase letter")
  .regex(/[a-z]/, "Password needs a lowercase letter")
  .regex(/\d/, "Password needs a digit");

export const createInternalAccountSchema = z
  .object({
    name: z.string().trim().min(2, "Name must be at least 2 characters"),
    email: z.string().email("Enter a valid email"),
    employeeId: z.string().trim().optional().or(z.literal("")),
    password: passwordSchema,
    confirmPassword: z.string(),
    role: roleSchema.optional(),
  })
  .refine((value) => value.password === value.confirmPassword, {
    path: ["confirmPassword"],
    message: "Passwords do not match",
  });

export const updateUserSchema = z.object({
  name: z.string().trim().min(2, "Name must be at least 2 characters"),
  email: z.string().email("Enter a valid email"),
  employeeId: z.string().trim().optional().or(z.literal("")),
  password: passwordSchema.optional().or(z.literal("")),
  active: z.boolean().optional(),
});

export const changeUserRoleSchema = z.object({
  role: roleSchema,
});

export const changeUserStatusSchema = z.object({
  active: z.boolean(),
  status: z.string().trim().optional().or(z.literal("")),
});

export type CreateInternalAccountSchemaValues = z.infer<
  typeof createInternalAccountSchema
>;
