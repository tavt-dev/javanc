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
import { useLanguage } from "@/lib/i18n";

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
  const { login, savedAccounts, switchAccount } = useAuth();
  const { t } = useLanguage();
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

  function continueWithSavedAccount(accountKey: string) {
    switchAccount(accountKey);
    router.push("/");
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
        <input className={inputClass} type="password" placeholder={t("auth.passwordPlaceholder")} {...register("password")} />
      </Field>
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
  const router = useRouter();
  const { login } = useAuth();
  const { t } = useLanguage();
  const [error, setError] = useState<string | null>(null);
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting }
  } = useForm<RegisterInput>({
    resolver: zodResolver(registerSchema),
    defaultValues: { role: "user" }
  });

  async function onSubmit(values: RegisterInput) {
    setError(null);
    try {
      await authApi.signup(values);
      const auth = await authApi.signin({ email: values.email, password: values.password });
      login(auth);
      router.push("/");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to register");
    }
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
      <Field label={t("auth.role")} error={errors.role?.message}>
        <select className={inputClass} {...register("role")}>
          <option value="user">{t("auth.userRole")}</option>
          <option value="hr">{t("auth.hrRole")}</option>
          <option value="manager">{t("auth.managerRole")}</option>
        </select>
      </Field>
      <Button type="submit" className="w-full" disabled={isSubmitting}>
        {isSubmitting ? t("auth.creatingAccount") : t("auth.registerButton")}
      </Button>
    </form>
  );
}
