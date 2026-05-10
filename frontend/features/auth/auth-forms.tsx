"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { authApi } from "@/lib/api";
import { Button, Field, inputClass } from "@/components/ui";
import { ErrorState } from "@/components/data-state";
import { useAuth } from "@/features/auth/auth-provider";

const loginSchema = z.object({
  email: z.string().email("Enter a valid email"),
  password: z.string().min(1, "Password is required")
});

const registerSchema = loginSchema
  .extend({
    name: z.string().min(2, "Name is required"),
    confirmPassword: z.string().min(1, "Confirm your password"),
    role: z.string().min(1, "Role is required")
  })
  .refine((value) => value.password === value.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"]
  });

type LoginInput = z.infer<typeof loginSchema>;
type RegisterInput = z.infer<typeof registerSchema>;

export function LoginForm() {
  const router = useRouter();
  const { login } = useAuth();
  const [error, setError] = useState<string | null>(null);
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting }
  } = useForm<LoginInput>({ resolver: zodResolver(loginSchema) });

  async function onSubmit(values: LoginInput) {
    setError(null);
    try {
      const auth = await authApi.signin(values);
      login(auth);
      router.push("/");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to sign in");
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      {error ? <ErrorState message={error} /> : null}
      <Field label="Email" error={errors.email?.message}>
        <input className={inputClass} type="email" placeholder="you@company.com" {...register("email")} />
      </Field>
      <Field label="Password" error={errors.password?.message}>
        <input className={inputClass} type="password" placeholder="Enter your password" {...register("password")} />
      </Field>
      <Button type="submit" className="w-full" disabled={isSubmitting}>
        {isSubmitting ? "Signing in..." : "Login"}
      </Button>
      <p className="text-center text-sm text-muted">
        New here?{" "}
        <Link href="/register" className="font-semibold text-brand">
          Create an account
        </Link>
      </p>
    </form>
  );
}

export function RegisterForm() {
  const router = useRouter();
  const { login } = useAuth();
  const [error, setError] = useState<string | null>(null);
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting }
  } = useForm<RegisterInput>({
    resolver: zodResolver(registerSchema),
    defaultValues: { role: "USER" }
  });

  async function onSubmit(values: RegisterInput) {
    setError(null);
    try {
      const auth = await authApi.signup(values);
      login(auth);
      router.push("/");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to register");
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      {error ? <ErrorState message={error} /> : null}
      <Field label="Name" error={errors.name?.message}>
        <input className={inputClass} placeholder="Full name" {...register("name")} />
      </Field>
      <Field label="Email" error={errors.email?.message}>
        <input className={inputClass} type="email" placeholder="you@company.com" {...register("email")} />
      </Field>
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Password" error={errors.password?.message}>
          <input className={inputClass} type="password" placeholder="Password" {...register("password")} />
        </Field>
        <Field label="Confirm password" error={errors.confirmPassword?.message}>
          <input className={inputClass} type="password" placeholder="Confirm password" {...register("confirmPassword")} />
        </Field>
      </div>
      <Field label="Role" error={errors.role?.message}>
        <select className={inputClass} {...register("role")}>
          <option value="USER">User</option>
          <option value="HR">HR</option>
          <option value="MANAGER">Manager</option>
        </select>
      </Field>
      <Button type="submit" className="w-full" disabled={isSubmitting}>
        {isSubmitting ? "Creating account..." : "Register"}
      </Button>
    </form>
  );
}
