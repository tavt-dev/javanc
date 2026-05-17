import { zodResolver } from "@hookform/resolvers/zod";
import { motion, useReducedMotion } from "framer-motion";
import type { ReactNode } from "react";
import { Link } from "react-router-dom";
import { useForm, useWatch } from "react-hook-form";
import { Check, Mail, UserRound } from "lucide-react";
import { AuthLayout } from "@/features/auth/components/AuthLayout";
import { AuthSubmitButton } from "@/features/auth/components/AuthSubmitButton";
import { GoogleSignInButton } from "@/features/auth/components/GoogleSignInButton";
import { PasswordField } from "@/features/auth/components/PasswordField";
import {
  useGoogleLoginMutation,
  useRegisterMutation,
} from "@/features/auth/hooks/use-auth-mutations";
import {
  registerSchema,
  type RegisterFormValues,
} from "@/features/auth/schemas/auth-schemas";
import { extractErrorMessage } from "@/lib/api-error";
import { cn } from "@/lib/utils";
import { useTranslation } from "react-i18next";

export function RegisterPage() {
  const { t } = useTranslation();
  const registerMutation = useRegisterMutation();
  const googleLoginMutation = useGoogleLoginMutation();
  const reducedMotion = useReducedMotion();
  const {
    register,
    handleSubmit,
    control,
    formState: { errors },
  } = useForm<RegisterFormValues>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      name: "",
      email: "",
      password: "",
      confirmPassword: "",
    },
  });

  const password = useWatch({ control, name: "password" }) ?? "";
  const submitError = registerMutation.isError
    ? extractErrorMessage(registerMutation.error)
    : null;
  const googleError = googleLoginMutation.isError
    ? extractErrorMessage(googleLoginMutation.error)
    : null;

  return (
    <AuthLayout
      title={t("auth.registerTitle")}
      subtitle={t("auth.registerSubtitle")}
    >
      <form
        onSubmit={handleSubmit((values) =>
          registerMutation.mutate({
            name: values.name,
            email: values.email,
            password: values.password,
          }),
        )}
        className="space-y-4"
        noValidate
      >
        <FieldShell index={0} reducedMotion={reducedMotion}>
          <label htmlFor="name" className="text-sm font-medium text-foreground">
            {t("auth.fullName")}
          </label>
          <div className="relative">
            <UserRound
              size={16}
              className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
            />
            <input
              id="name"
              type="text"
              autoComplete="name"
              placeholder="Nguyen Van A"
              className={inputClass(Boolean(errors.name), "pl-9")}
              {...register("name")}
            />
          </div>
          {errors.name && (
            <p className="text-xs text-destructive">{errors.name.message}</p>
          )}
        </FieldShell>

        <FieldShell index={1} reducedMotion={reducedMotion}>
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
              className={inputClass(Boolean(errors.email), "pl-9")}
              {...register("email")}
            />
          </div>
          {errors.email && (
            <p className="text-xs text-destructive">{errors.email.message}</p>
          )}
        </FieldShell>

        <FieldShell index={2} reducedMotion={reducedMotion}>
          <PasswordField
            label={t("auth.password")}
            placeholder={t("auth.strongPasswordPlaceholder")}
            autoComplete="new-password"
            error={errors.password?.message}
            {...register("password")}
          />
        </FieldShell>

        <PasswordChecklist password={password} />

        <FieldShell index={3} reducedMotion={reducedMotion}>
          <PasswordField
            label={t("auth.confirmPassword")}
            placeholder={t("auth.confirmPasswordPlaceholder")}
            autoComplete="new-password"
            error={errors.confirmPassword?.message}
            {...register("confirmPassword")}
          />
        </FieldShell>

        {submitError && (
          <div className="rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
            {submitError}
          </div>
        )}

        <FieldShell index={4} reducedMotion={reducedMotion}>
          <AuthSubmitButton loading={registerMutation.isPending}>
            {t("auth.createAccount")}
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
        {t("auth.alreadyHaveAccount")}{" "}
        <Link to="/login" className="font-medium text-primary hover:underline">
          {t("auth.signIn")}
        </Link>
      </p>
      <AuthLegalLinks />
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

function PasswordChecklist({ password }: { password: string }) {
  const { t } = useTranslation();
  const rules = [
    [t("auth.passwordRules.length"), password.length >= 8],
    [t("auth.passwordRules.uppercase"), /[A-Z]/.test(password)],
    [t("auth.passwordRules.lowercase"), /[a-z]/.test(password)],
    [t("auth.passwordRules.number"), /\d/.test(password)],
  ] as const;

  return (
    <div className="grid grid-cols-2 gap-2 rounded-lg bg-muted p-3">
      {rules.map(([label, valid]) => (
        <div
          key={label}
          className={cn(
            "flex items-center gap-2 text-xs",
            valid ? "text-success" : "text-muted-foreground",
          )}
        >
          <span
            className={cn(
              "flex h-4 w-4 shrink-0 items-center justify-center rounded-full border",
              valid
                ? "border-success bg-success text-white"
                : "border-muted-foreground/40",
            )}
          >
            {valid && <Check size={11} />}
          </span>
          {label}
        </div>
      ))}
    </div>
  );
}

function inputClass(hasError: boolean, extra?: string) {
  return cn(
    "h-11 w-full rounded-lg border border-input bg-background px-3 text-sm outline-none transition-shadow",
    "placeholder:text-muted-foreground focus:border-transparent focus:ring-2 focus:ring-ring",
    hasError && "border-destructive focus:ring-destructive",
    extra,
  );
}

function AuthLegalLinks() {
  const { t } = useTranslation();

  return (
    <p className="mt-4 text-center text-xs leading-6 text-muted-foreground">
      {t("auth.legalPrefix")}{" "}
      <Link to="/privacy" className="font-medium text-primary hover:underline">
        {t("footer.privacy")}
      </Link>{" "}
      {t("auth.legalConjunction")}{" "}
      <Link to="/terms" className="font-medium text-primary hover:underline">
        {t("footer.terms")}
      </Link>
      .
    </p>
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
