"use client";

import { useState } from "react";
import Link from "next/link";
import { Eye, EyeOff } from "lucide-react";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { authApi } from "@/lib/api";
import { Button, Field, inputClass } from "@/components/ui";
import { ErrorState } from "@/components/data-state";
import { useAuth } from "@/features/auth/auth-provider";
import { useLanguage } from "@/lib/i18n";

const loginSchema = z.object({
  email: z.string().email("Enter a valid email"),
  password: z.string().min(1, "Password is required")
});

const registerSchema = loginSchema
  .extend({
    name: z.string().min(2, "Name is required"),
    confirmPassword: z.string().min(1, "Confirm your password")
  })
  .refine((value) => value.password === value.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"]
  });

type LoginInput = z.infer<typeof loginSchema>;
type RegisterInput = z.infer<typeof registerSchema>;

export function LoginForm() {
  const { login, savedAccounts, switchAccount } = useAuth();
  const { t } = useLanguage();
  const [error, setError] = useState<string | null>(null);
  const [saveAccount, setSaveAccount] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting }
  } = useForm<LoginInput>({ resolver: zodResolver(loginSchema) });

  async function onSubmit(values: LoginInput) {
    setError(null);
    try {
      const auth = await authApi.signin(values);
      login(auth, saveAccount, saveAccount ? values : undefined);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to sign in");
    }
  }

  async function continueWithSavedAccount(accountKey: string) {
    setError(null);
    try {
      await switchAccount(accountKey);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to sign in with saved account");
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      {error ? <ErrorState message={error} /> : null}
      {savedAccounts.length ? (
        <div className="border-b border-line pb-4">
          <p className="text-xs font-semibold uppercase text-muted">{t("auth.savedAccounts")}</p>
          <div className="mt-3 grid gap-2">
            {savedAccounts.map((account) => (
              <button
                key={account.key}
                type="button"
                onClick={() => continueWithSavedAccount(account.key)}
                className="focus-ring flex min-h-12 items-center justify-between gap-3 rounded-md border border-line bg-white px-3 py-2 text-left text-sm transition hover:border-brand hover:text-brand"
              >
                <span className="min-w-0">
                  <span className="block truncate font-semibold text-ink">{account.label}</span>
                  <span className="block truncate text-xs text-muted">{account.email ?? account.role ?? t("account.signedIn")}</span>
                </span>
                <span className="shrink-0 text-xs font-semibold text-brand">{t("auth.continue")}</span>
              </button>
            ))}
          </div>
        </div>
      ) : null}
      <Field label={t("auth.email")} error={errors.email?.message}>
        <input className={inputClass} type="email" placeholder="you@company.com" {...register("email")} />
      </Field>
      <Field label={t("auth.password")} error={errors.password?.message}>
        <div className="relative">
          <input
            className={`${inputClass} pr-11`}
            type={showPassword ? "text" : "password"}
            placeholder={t("auth.passwordPlaceholder")}
            autoComplete="current-password"
            {...register("password")}
          />
          <button
            type="button"
            className="focus-ring pressable absolute right-2 top-1/2 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-md text-muted hover:bg-slate-100 hover:text-ink"
            onClick={() => setShowPassword((current) => !current)}
            aria-label={showPassword ? "Hide password" : "Show password"}
            aria-pressed={showPassword}
          >
            {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
          </button>
        </div>
      </Field>
      <label className="flex items-center gap-2 text-sm font-semibold text-muted">
        <input
          type="checkbox"
          className="h-4 w-4 accent-brand"
          checked={saveAccount}
          onChange={(event) => setSaveAccount(event.target.checked)}
        />
        Save this account on this browser
      </label>
      <Button type="submit" className="w-full" disabled={isSubmitting}>
        {isSubmitting ? t("auth.signingIn") : t("auth.loginButton")}
      </Button>
      <p className="text-center text-sm text-muted">
        {t("auth.newHere")}{" "}
        <Link href="/register" className="font-semibold text-brand">
          {t("auth.createAccount")}
        </Link>
      </p>
    </form>
  );
}

export function RegisterForm() {
  const { login } = useAuth();
  const { t } = useLanguage();
  const [error, setError] = useState<string | null>(null);
  const [pendingEmail, setPendingEmail] = useState<string | null>(null);
  const [otp, setOtp] = useState("");
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting }
  } = useForm<RegisterInput>({
    resolver: zodResolver(registerSchema)
  });

  async function onSubmit(values: RegisterInput) {
    setError(null);
    try {
      const pending = await authApi.signup(values);
      setPendingEmail(pending.email || values.email);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to register");
    }
  }

  async function verifyOtp(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!pendingEmail) {
      return;
    }
    setError(null);
    try {
      const auth = await authApi.verifyEmail(pendingEmail, otp);
      login(auth, false);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to verify email");
    }
  }

  async function resendOtp() {
    if (!pendingEmail) {
      return;
    }
    setError(null);
    try {
      await authApi.resendVerificationOtp(pendingEmail);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to resend verification code");
    }
  }

  if (pendingEmail) {
    return (
      <form onSubmit={verifyOtp} className="space-y-4">
        {error ? <ErrorState message={error} /> : null}
        <div className="rounded-md border border-line bg-canvas p-4 text-sm text-muted">
          We sent a verification code to <span className="font-semibold text-ink">{pendingEmail}</span>.
        </div>
        <Field label="Verification code">
          <input
            className={inputClass}
            inputMode="numeric"
            maxLength={8}
            placeholder="123456"
            value={otp}
            onChange={(event) => setOtp(event.target.value)}
          />
        </Field>
        <Button type="submit" className="w-full" disabled={!otp.trim()}>
          Verify email
        </Button>
        <button type="button" className="w-full text-sm font-semibold text-brand" onClick={resendOtp}>
          Resend code
        </button>
      </form>
    );
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      {error ? <ErrorState message={error} /> : null}
      <Field label={t("auth.name")} error={errors.name?.message}>
        <input className={inputClass} placeholder={t("auth.namePlaceholder")} {...register("name")} />
      </Field>
      <Field label={t("auth.email")} error={errors.email?.message}>
        <input className={inputClass} type="email" placeholder="you@company.com" {...register("email")} />
      </Field>
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label={t("auth.password")} error={errors.password?.message}>
          <input className={inputClass} type="password" placeholder={t("auth.password")} {...register("password")} />
        </Field>
        <Field label={t("auth.confirmPassword")} error={errors.confirmPassword?.message}>
          <input className={inputClass} type="password" placeholder={t("auth.confirmPassword")} {...register("confirmPassword")} />
        </Field>
      </div>
      <Button type="submit" className="w-full" disabled={isSubmitting}>
        {isSubmitting ? t("auth.creatingAccount") : t("auth.registerButton")}
      </Button>
    </form>
  );
}
