import Link from "next/link";
import type { ComponentProps } from "react";

export function Button({
  className = "",
  variant = "primary",
  ...props
}: ComponentProps<"button"> & { variant?: "primary" | "secondary" | "danger" }) {
  const styles = {
    primary: "bg-ink text-white hover:bg-brand",
    secondary: "border border-line bg-white text-ink hover:bg-canvas",
    danger: "bg-danger text-white hover:bg-red-700"
  };

  return (
    <button
      className={`focus-ring inline-flex items-center justify-center rounded-md px-4 py-2 text-sm font-semibold transition ${styles[variant]} disabled:cursor-not-allowed disabled:opacity-60 ${className}`}
      {...props}
    />
  );
}

export function LinkButton({
  className = "",
  variant = "primary",
  ...props
}: ComponentProps<typeof Link> & { variant?: "primary" | "secondary" }) {
  const styles = {
    primary: "bg-ink text-white hover:bg-brand",
    secondary: "border border-line bg-white text-ink hover:bg-canvas"
  };

  return (
    <Link
      className={`focus-ring inline-flex items-center justify-center rounded-md px-4 py-2 text-sm font-semibold transition ${styles[variant]} ${className}`}
      {...props}
    />
  );
}

export function Field({
  label,
  error,
  children
}: {
  label: string;
  error?: string;
  children: React.ReactNode;
}) {
  return (
    <label className="block">
      <span className="mb-1 block text-sm font-medium text-ink">{label}</span>
      {children}
      {error ? <span className="mt-1 block text-xs font-medium text-danger">{error}</span> : null}
    </label>
  );
}

export const inputClass =
  "focus-ring w-full rounded-md border border-line bg-white px-3 py-2 text-sm text-ink placeholder:text-slate-400";

export function Pill({ children, tone = "neutral" }: { children: React.ReactNode; tone?: "neutral" | "green" | "blue" | "orange" }) {
  const styles = {
    neutral: "bg-slate-100 text-slate-700",
    green: "bg-emerald-50 text-emerald-700",
    blue: "bg-sky-50 text-brand",
    orange: "bg-orange-50 text-warn"
  };

  return <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${styles[tone]}`}>{children}</span>;
}
