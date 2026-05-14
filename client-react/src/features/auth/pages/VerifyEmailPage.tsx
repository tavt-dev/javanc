import { zodResolver } from "@hookform/resolvers/zod";
import { motion, useReducedMotion } from "framer-motion";
import type { ReactNode } from "react";
import { useEffect, useMemo, useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { Link, useSearchParams } from "react-router-dom";
import { MailCheck, RotateCcw } from "lucide-react";
import { AuthLayout } from "@/features/auth/components/AuthLayout";
import { AuthSubmitButton } from "@/features/auth/components/AuthSubmitButton";
import { OtpInput } from "@/features/auth/components/OtpInput";
import {
  useResendVerificationOtpMutation,
  useVerifyEmailMutation,
} from "@/features/auth/hooks/use-auth-mutations";
import {
  verifyEmailSchema,
  type VerifyEmailFormValues,
} from "@/features/auth/schemas/auth-schemas";
import { extractErrorMessage } from "@/lib/api-error";
import { cn } from "@/lib/utils";
import { useTranslation } from "react-i18next";

const RESEND_COOLDOWN_SECONDS = 60;
const DEFAULT_OTP_TTL_SECONDS = 600;

export function VerifyEmailPage() {
  const { t } = useTranslation();
  const [searchParams] = useSearchParams();
  const email = searchParams.get("email") ?? "";
  const initialExpiresIn = Number(searchParams.get("expiresInSeconds"));
  const [expiresIn, setExpiresIn] = useState(
    Number.isFinite(initialExpiresIn) && initialExpiresIn > 0
      ? initialExpiresIn
      : 0,
  );
  const [resendCooldown, setResendCooldown] = useState(0);
  const reducedMotion = useReducedMotion();
  const verifyMutation = useVerifyEmailMutation();
  const resendMutation = useResendVerificationOtpMutation();
  const {
    register,
    handleSubmit,
    control,
    formState: { errors },
  } = useForm<VerifyEmailFormValues>({
    resolver: zodResolver(verifyEmailSchema),
    defaultValues: { email, otp: "" },
  });

  useEffect(() => {
    if (expiresIn <= 0) return;
    const interval = window.setInterval(() => {
      setExpiresIn((value) => Math.max(0, value - 1));
    }, 1000);
    return () => window.clearInterval(interval);
  }, [expiresIn]);

  useEffect(() => {
    if (resendCooldown <= 0) return;
    const interval = window.setInterval(() => {
      setResendCooldown((value) => Math.max(0, value - 1));
    }, 1000);
    return () => window.clearInterval(interval);
  }, [resendCooldown]);

  const submitError = verifyMutation.isError
    ? extractErrorMessage(verifyMutation.error)
    : null;
  const resendError = resendMutation.isError
    ? extractErrorMessage(resendMutation.error)
    : null;
  const formattedExpiresIn = useMemo(() => formatSeconds(expiresIn), [expiresIn]);

  return (
    <AuthLayout
      title={t("auth.verifyTitle")}
      subtitle={t("auth.verifySubtitle")}
    >
      <form
        onSubmit={handleSubmit((values) => verifyMutation.mutate(values))}
        className="space-y-4"
        noValidate
      >
        <FieldShell index={0} reducedMotion={reducedMotion}>
          <label htmlFor="email" className="text-sm font-medium text-foreground">
            {t("auth.email")}
          </label>
          <div className="relative">
            <MailCheck
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
          <Controller
            name="otp"
            control={control}
            render={({ field }) => (
              <OtpInput
                value={field.value}
                onChange={field.onChange}
                disabled={verifyMutation.isPending}
                error={errors.otp?.message}
              />
            )}
          />
        </FieldShell>

        {expiresIn > 0 && (
          <p className="text-center text-xs text-muted-foreground">
            {t("auth.codeExpiresIn", { time: formattedExpiresIn })}
          </p>
        )}

        {submitError && (
          <div className="rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
            {submitError}
          </div>
        )}

        {resendError && (
          <div className="rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
            {resendError}
          </div>
        )}

        <FieldShell index={2} reducedMotion={reducedMotion}>
          <AuthSubmitButton loading={verifyMutation.isPending}>
            {t("auth.verifyEmail")}
          </AuthSubmitButton>
        </FieldShell>
      </form>

      <div className="mt-5 flex flex-col items-center gap-3 text-sm">
        <button
          type="button"
          disabled={resendCooldown > 0 || resendMutation.isPending || !email}
          onClick={() =>
            resendMutation.mutate(
              { email },
              {
                onSuccess: () => {
                  setResendCooldown(RESEND_COOLDOWN_SECONDS);
                  setExpiresIn(DEFAULT_OTP_TTL_SECONDS);
                },
              },
            )
          }
          className="inline-flex items-center gap-2 rounded-md px-2 py-1 font-medium text-primary transition-colors hover:bg-accent disabled:cursor-not-allowed disabled:text-muted-foreground"
        >
          <RotateCcw size={15} />
          {resendCooldown > 0
            ? t("auth.resendIn", { seconds: resendCooldown })
            : t("auth.resendCode")}
        </button>
        <div className="text-muted-foreground">
          {t("auth.wrongEmail")}{" "}
          <Link to="/register" className="font-medium text-primary hover:underline">
            {t("auth.startAgain")}
          </Link>
        </div>
      </div>
    </AuthLayout>
  );
}

function formatSeconds(value: number) {
  const minutes = Math.floor(value / 60);
  const seconds = value % 60;
  return `${minutes}:${seconds.toString().padStart(2, "0")}`;
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
