import axios from "axios";
import { zodResolver } from "@hookform/resolvers/zod";
import { motion, useReducedMotion } from "framer-motion";
import type { ReactNode } from "react";
import { Link } from "react-router-dom";
import { useForm } from "react-hook-form";
import { Mail } from "lucide-react";
import { AuthLayout } from "@/features/auth/components/AuthLayout";
import { AuthSubmitButton } from "@/features/auth/components/AuthSubmitButton";
import { GoogleSignInButton } from "@/features/auth/components/GoogleSignInButton";
import { PasswordField } from "@/features/auth/components/PasswordField";
import {
  useGoogleLoginMutation,
  useLoginMutation,
} from "@/features/auth/hooks/use-auth-mutations";
import {
  loginSchema,
  type LoginFormValues,
} from "@/features/auth/schemas/auth-schemas";
import { extractErrorMessage } from "@/lib/api-error";
import { cn } from "@/lib/utils";
import { useTranslation } from "react-i18next";

export function LoginPage() {
  const { t } = useTranslation();
  const loginMutation = useLoginMutation();
  const googleLoginMutation = useGoogleLoginMutation();
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
  const googleError = googleLoginMutation.isError
    ? extractErrorMessage(googleLoginMutation.error)
    : null;

  return (
    <AuthLayout
      title={t("auth.loginTitle")}
      subtitle={t("auth.loginSubtitle")}
    >
      <form
        onSubmit={handleSubmit((values) => loginMutation.mutate(values))}
        className="space-y-4"
        noValidate
      >
        <FieldShell index={0} reducedMotion={reducedMotion}>
          <label htmlFor="email" className="text-sm font-medium text-foreground">
            {t("auth.email")}
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
            label={t("auth.password")}
            placeholder={t("auth.passwordPlaceholder")}
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
            {t("auth.signIn")}
          </AuthSubmitButton>
        </FieldShell>
      </form>

      <AuthDivider />

      <GoogleSignInButton
        disabled={googleLoginMutation.isPending}
        onCredential={(idToken) => googleLoginMutation.mutate({ idToken })}
      />

      {googleLoginMutation.isPending && (
        <p className="mt-2 text-center text-xs text-muted-foreground">
          {t("auth.googleSigningIn")}
        </p>
      )}

      {googleError && (
        <div className="mt-3 rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
          {googleError}
        </div>
      )}

      <p className="mt-5 text-center text-sm text-muted-foreground">
        {t("auth.needAccount")}{" "}
        <Link to="/register" className="font-medium text-primary hover:underline">
          {t("auth.createOne")}
        </Link>
      </p>
    </AuthLayout>
  );
}

function AuthDivider() {
  const { t } = useTranslation();

  return (
    <div className="my-5 flex items-center gap-3 text-xs uppercase text-muted-foreground">
      <span className="h-px flex-1 bg-border" />
      <span>{t("auth.orContinueWith")}</span>
      <span className="h-px flex-1 bg-border" />
    </div>
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
