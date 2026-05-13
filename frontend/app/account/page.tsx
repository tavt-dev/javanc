"use client";

import { useState } from "react";
import { Protected } from "@/components/protected";
import { PageHeader } from "@/components/page-header";
import { useAuth } from "@/features/auth/auth-provider";
import { Button, Field, inputClass, Pill } from "@/components/ui";
import { ErrorState } from "@/components/data-state";
import { authApi } from "@/lib/api";
import { setStoredUser } from "@/lib/storage";

export default function AccountPage() {
  const { user } = useAuth();
  const [name, setName] = useState(user?.name ?? "");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState<"name" | "password" | null>(null);

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
      setMessage("Account name updated. Sign in state will refresh now.");
      window.location.reload();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to update name");
    } finally {
      setSaving(null);
    }
  }

  async function changePassword() {
    if (!user?.id) {
      return;
    }
    setSaving("password");
    setError(null);
    setMessage(null);
    try {
      await authApi.update({ ...user, password });
      setPassword("");
      setMessage("Password updated.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to update password");
    } finally {
      setSaving(null);
    }
  }

  return (
    <Protected>
      <PageHeader eyebrow="Account" title={user?.name || "Current user"} description="Manage your account details and sign-in information." />
      {error ? <ErrorState message={error} /> : null}
      {message ? <div className="mb-6 rounded-md border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-700">{message}</div> : null}
      <div className="grid gap-6 lg:grid-cols-[0.9fr_1.1fr]">
        <section className="rounded-md border border-line bg-white p-5 shadow-soft">
          <h2 className="text-lg font-semibold text-ink">Account info</h2>
          <div className="mt-5 grid gap-4 text-sm">
            <Info label="Email" value={user?.email || "Not available"} />
            <div>
              <p className="font-semibold text-ink">Role</p>
              <p className="mt-1">
                <Pill tone="blue">{roleLabel(user?.role)}</Pill>
              </p>
            </div>
            <Info label="User ID" value={user?.id ?? "Not available"} />
            <Info label="Employee ID" value={user?.idEmployee || "Not available"} />
          </div>
        </section>

        <section className="rounded-md border border-line bg-white p-5 shadow-soft">
          <h2 className="text-lg font-semibold text-ink">Edit account</h2>
          <div className="mt-5 grid gap-5">
            <div className="grid gap-3 sm:grid-cols-[1fr_auto] sm:items-end">
              <Field label="Display name">
                <input className={inputClass} value={name} onChange={(event) => setName(event.target.value)} />
              </Field>
              <Button type="button" onClick={rename} disabled={!name.trim() || saving === "name"}>
                {saving === "name" ? "Saving..." : "Rename"}
              </Button>
            </div>
            <div className="grid gap-3 sm:grid-cols-[1fr_auto] sm:items-end">
              <Field label="New password">
                <input className={inputClass} type="password" value={password} onChange={(event) => setPassword(event.target.value)} placeholder="At least 8 chars with upper, lower, digit" />
              </Field>
              <Button type="button" onClick={changePassword} disabled={!password || saving === "password"}>
                {saving === "password" ? "Saving..." : "Change password"}
              </Button>
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

function roleLabel(role?: string) {
  if (role === "admin") {
    return "System Admin";
  }
  if (role === "hr") {
    return "HR";
  }
  return role ? role.charAt(0).toUpperCase() + role.slice(1) : "Unknown";
}
