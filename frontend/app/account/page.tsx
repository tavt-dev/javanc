"use client";

import { useEffect, useRef, useState } from "react";
import { Protected } from "@/components/protected";
import { PageHeader } from "@/components/page-header";
import { useAuth } from "@/features/auth/auth-provider";
import { Button, Field, inputClass, Pill } from "@/components/ui";
import { ErrorState } from "@/components/data-state";
import { authApi, companyApi } from "@/lib/api";
import { setStoredUser } from "@/lib/storage";
import { useLanguage } from "@/lib/i18n";

export default function AccountPage() {
  const { user, updateUser } = useAuth();
  const { t } = useLanguage();
  const [name, setName] = useState(user?.name ?? "");
  const [passwordChangeOpen, setPasswordChangeOpen] = useState(false);
  const [resetCodeSent, setResetCodeSent] = useState(false);
  const [otp, setOtp] = useState("");
  const [password, setPassword] = useState("");
  const resetCodeInputRef = useRef<HTMLInputElement | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState<"name" | "passwordRequest" | "passwordConfirm" | "leaveHr" | null>(null);

  useEffect(() => {
    setName(user?.name ?? "");
  }, [user?.name]);

  useEffect(() => {
    if (resetCodeSent) {
      resetCodeInputRef.current?.focus();
    }
  }, [resetCodeSent]);

  async function rename() {
    if (!user?.id) {
      return;
    }
    setSaving("name");
    setError(null);
    setMessage(null);
    try {
      const updated = await authApi.update({ ...user, name });
      setStoredUser(updated);
      updateUser(updated);
      setMessage(t("account.nameUpdated"));
    } catch (err) {
      setError(err instanceof Error ? err.message : t("account.unableUpdateName"));
    } finally {
      setSaving(null);
    }
  }

  async function requestPasswordReset() {
    if (!user?.email) {
      return;
    }
    setSaving("passwordRequest");
    setError(null);
    setMessage(null);
    try {
      await authApi.requestPasswordReset(user.email);
      setResetCodeSent(true);
      setMessage(t("account.codeSent"));
    } catch (err) {
      setError(err instanceof Error ? err.message : t("account.unableSendCode"));
    } finally {
      setSaving(null);
    }
  }

  async function confirmPasswordReset() {
    if (!user?.email) {
      return;
    }
    setSaving("passwordConfirm");
    setError(null);
    setMessage(null);
    try {
      await authApi.confirmPasswordReset(user.email, otp, password);
      setOtp("");
      setPassword("");
      setResetCodeSent(false);
      setPasswordChangeOpen(false);
      setMessage(t("account.passwordUpdated"));
    } catch (err) {
      setError(err instanceof Error ? err.message : t("account.unableUpdatePassword"));
    } finally {
      setSaving(null);
    }
  }

  async function leaveHr() {
    setSaving("leaveHr");
    setError(null);
    setMessage(null);
    try {
      await companyApi.leaveHr();
      setStoredUser(await authApi.currentUser());
      window.location.assign("/");
    } catch (err) {
      setError(err instanceof Error ? err.message : t("account.unableLeaveHr"));
      setSaving(null);
    }
  }

  return (
    <Protected>
      <PageHeader eyebrow={t("account.title")} title={user?.name || t("account.currentUser")} description={t("account.description")} />
      {error ? <ErrorState message={error} /> : null}
      {message ? <div className="mb-6 rounded-md border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-700">{message}</div> : null}
      <div className="grid gap-6 lg:grid-cols-[0.9fr_1.1fr]">
        <section className="glass-panel scroll-reveal rounded-md p-5">
          <h2 className="text-lg font-semibold text-ink">{t("account.info")}</h2>
          <div className="mt-5 grid gap-4 text-sm">
            <Info label={t("account.email")} value={user?.email || t("account.notAvailable")} />
            <div>
              <p className="font-semibold text-ink">{t("account.role")}</p>
              <p className="mt-1">
                <Pill tone="blue">{roleLabel(user?.role, t)}</Pill>
              </p>
            </div>
            <Info label={t("account.userId")} value={user?.id ?? t("account.notAvailable")} />
            <Info label={t("account.employeeId")} value={user?.idEmployee || t("account.notAvailable")} />
          </div>
          {user?.role === "hr" ? (
            <div className="mt-5 rounded-md border border-line bg-canvas p-4">
              <p className="font-semibold text-ink">{t("account.hrRole")}</p>
              <p className="mt-1 text-sm text-muted">{t("account.leaveHrHelp")}</p>
              <Button type="button" variant="secondary" className="mt-3" onClick={leaveHr} disabled={saving === "leaveHr"}>
                {t("account.leaveHr")}
              </Button>
            </div>
          ) : null}
        </section>

        <section className="glass-panel scroll-reveal rounded-md p-5">
          <h2 className="text-lg font-semibold text-ink">{t("account.edit")}</h2>
          <div className="mt-5 grid gap-5">
            <div className="grid gap-3 sm:grid-cols-[1fr_auto] sm:items-end">
              <Field label={t("account.displayName")}>
                <input className={inputClass} value={name} onChange={(event) => setName(event.target.value)} />
              </Field>
              <Button type="button" onClick={rename} disabled={!name.trim() || saving === "name"}>
                {saving === "name" ? t("common.saving") : t("account.rename")}
              </Button>
            </div>
            <div className="rounded-md border border-line bg-canvas p-4">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <h3 className="font-semibold text-ink">{t("account.changePassword")}</h3>
                  <p className="mt-1 text-sm text-muted">
                    {passwordChangeOpen
                      ? t("account.passwordOpenIntro", { email: user?.email || t("account.yourEmail") })
                      : t("account.passwordIntro")}
                  </p>
                </div>
                {!passwordChangeOpen ? (
                  <Button type="button" variant="secondary" onClick={() => setPasswordChangeOpen(true)}>
                    {t("account.change")}
                  </Button>
                ) : (
                  <div className="flex gap-2">
                    <Button type="button" variant="secondary" onClick={requestPasswordReset} disabled={saving === "passwordRequest" || !user?.email}>
                      {saving === "passwordRequest" ? t("account.sending") : resetCodeSent ? t("account.resendCode") : t("account.sendCode")}
                    </Button>
                    <Button
                      type="button"
                      variant="secondary"
                      onClick={() => {
                        setPasswordChangeOpen(false);
                        setResetCodeSent(false);
                        setOtp("");
                        setPassword("");
                      }}
                    >
                      {t("common.cancel")}
                    </Button>
                  </div>
                )}
              </div>
              {passwordChangeOpen && resetCodeSent ? (
                <div className="light-form-panel mt-4 rounded-md border border-accent/50 bg-[#fffdf5] p-4 shadow-sm">
                  <div className="mb-4">
                    <p className="font-semibold text-[#10103a]">{t("account.enterCode")}</p>
                    <p className="mt-1 text-sm text-[#6b6885]">
                      {t("account.checkEmail", { email: user?.email || t("account.yourEmail") })}
                    </p>
                  </div>
                  <div className="grid gap-3 sm:grid-cols-[0.7fr_1fr_auto] sm:items-end">
                    <Field label={t("account.resetCode")}>
                      <input
                        ref={resetCodeInputRef}
                        className={inputClass}
                        inputMode="numeric"
                        value={otp}
                        onChange={(event) => setOtp(event.target.value)}
                        placeholder="123456"
                      />
                    </Field>
                    <Field label={t("account.newPassword")}>
                      <input className={inputClass} type="password" value={password} onChange={(event) => setPassword(event.target.value)} placeholder={t("account.passwordPlaceholder")} />
                    </Field>
                    <Button type="button" onClick={confirmPasswordReset} disabled={!otp.trim() || !password || saving === "passwordConfirm"}>
                      {saving === "passwordConfirm" ? t("common.saving") : t("common.update")}
                    </Button>
                  </div>
                </div>
              ) : null}
            </div>
          </div>
        </section>
      </div>
    </Protected>
  );
}

function Info({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div>
      <p className="font-semibold text-ink">{label}</p>
      <p className="mt-1 break-words text-muted">{value}</p>
    </div>
  );
}

function roleLabel(role: string | undefined, t: (key: string) => string) {
  if (role === "admin") {
    return t("account.systemAdmin");
  }
  if (role === "hr") {
    return "HR";
  }
  return role ? role.charAt(0).toUpperCase() + role.slice(1) : t("account.unknown");
}
