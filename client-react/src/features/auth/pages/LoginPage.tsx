import axios from "axios";
import { zodResolver } from "@hookform/resolvers/zod";
import { motion, useReducedMotion } from "framer-motion";
import type { ReactNode } from "react";
import { Link } from "react-router-dom";
import { useForm } from "react-hook-form";
import { Mail } from "lucide-react";
import { AuthLayout } from "@/features/auth/components/AuthLayout";
import { AuthSubmitButton } from "@/features/auth/components/AuthSubmitButton";
import { PasswordField } from "@/features/auth/components/PasswordField";
import { useLoginMutation } from "@/features/auth/hooks/use-auth-mutations";
import {
  loginSchema,
  type LoginFormValues,
} from "@/features/auth/schemas/auth-schemas";
import { extractErrorMessage } from "@/lib/api-error";
import { cn } from "@/lib/utils";

export function LoginPage() {
  const loginMutation = useLoginMutation();
  const reducedMotion = useReducedMotion();
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: "", password: "" },
  });

  const submitError =
    loginMutation.isError && !isVerificationRedirect(loginMutation.error)
      ? extractErrorMessage(loginMutation.error)
      : null;

  return (
    <AuthLayout
      title="Welcome back"
      subtitle="Sign in with your verified JavaNC account"
    >
      <form
        onSubmit={handleSubmit((values) => loginMutation.mutate(values))}
        className="space-y-4"
        noValidate
      >
        <FieldShell index={0} reducedMotion={reducedMotion}>
          <label htmlFor="email" className="text-sm font-medium text-foreground">
            Email
          </label>
          <div className="relative">
            <Mail
              size={16}
              className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
            />
            <input
              id="email"
              type="email"
              autoComplete="email"
              placeholder="you@example.com"
              className={cn(
                "h-11 w-full rounded-lg border border-input bg-background px-3 pl-9 text-sm outline-none transition-shadow",
                "placeholder:text-muted-foreground focus:border-transparent focus:ring-2 focus:ring-ring",
                errors.email && "border-destructive focus:ring-destructive",
              )}
              {...register("email")}
            />
          </div>
          {errors.email && (
            <p className="text-xs text-destructive">{errors.email.message}</p>
          )}
        </FieldShell>

        <FieldShell index={1} reducedMotion={reducedMotion}>
          <PasswordField
            label="Password"
            placeholder="Enter your password"
            autoComplete="current-password"
            error={errors.password?.message}
            {...register("password")}
          />
        </FieldShell>

        {submitError && (
          <div className="rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
            {submitError}
          </div>
        )}

        <FieldShell index={2} reducedMotion={reducedMotion}>
          <AuthSubmitButton loading={loginMutation.isPending}>
            Sign in
          </AuthSubmitButton>
        </FieldShell>
      </form>

      <p className="mt-5 text-center text-sm text-muted-foreground">
        Need an account?{" "}
        <Link to="/register" className="font-medium text-primary hover:underline">
          Create one
        </Link>
      </p>
    </AuthLayout>
  );
}

function isVerificationRedirect(error: unknown) {
  if (!axios.isAxiosError(error)) return false;
  const message = String(error.response?.data?.message ?? "");
  return (
    error.response?.status === 403 &&
    message.toLowerCase().includes("verification")
  );
}

function FieldShell({
  children,
  index,
  reducedMotion,
}: {
  children: ReactNode;
  index: number;
  reducedMotion: boolean | null;
}) {
  return (
    <motion.div
      className="space-y-1.5"
      initial={reducedMotion ? false : { opacity: 0, y: 8 }}
      animate={reducedMotion ? undefined : { opacity: 1, y: 0 }}
      transition={{ duration: reducedMotion ? 0 : 0.18, delay: index * 0.035 }}
    >
      {children}
    </motion.div>
  );
}
