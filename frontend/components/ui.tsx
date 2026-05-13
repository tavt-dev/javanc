"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import type { ComponentProps } from "react";
import { ArrowLeft, ChevronRight } from "lucide-react";

export function Button({
  className = "",
  variant = "primary",
  ...props
}: ComponentProps<"button"> & { variant?: "primary" | "secondary" | "danger" }) {
  const styles = {
    primary: "bg-accent text-ink hover:bg-yellow-300",
    secondary: "border border-line bg-white text-ink hover:bg-slate-50",
    danger: "bg-danger text-white hover:bg-red-700"
  };

  return (
    <button
      className={`focus-ring inline-flex items-center justify-center rounded-md px-4 py-2 text-sm font-semibold shadow-sm transition duration-200 hover:-translate-y-0.5 hover:shadow-soft active:translate-y-0 disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:translate-y-0 ${styles[variant]} ${className}`}
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
    primary: "bg-accent text-ink hover:bg-yellow-300",
    secondary: "border border-line bg-white text-ink hover:bg-slate-50"
  };

  return (
    <Link
      className={`focus-ring inline-flex items-center justify-center rounded-md px-4 py-2 text-sm font-semibold shadow-sm transition duration-200 hover:-translate-y-0.5 hover:shadow-soft active:translate-y-0 ${styles[variant]} ${className}`}
      {...props}
    />
  );
}

export function BackButton({ href, label = "Back" }: { href?: string; label?: string }) {
  const router = useRouter();

  if (href) {
    return (
      <LinkButton href={href} variant="secondary" className="gap-2">
        <ArrowLeft className="h-4 w-4" />
        {label}
      </LinkButton>
    );
  }

  return (
    <Button type="button" variant="secondary" className="gap-2" onClick={() => router.back()}>
      <ArrowLeft className="h-4 w-4" />
      {label}
    </Button>
  );
}

export function Breadcrumbs({ items }: { items: Array<{ label: string; href?: string }> }) {
  return (
    <nav className="mb-4 flex flex-wrap items-center gap-2 text-sm" aria-label="Breadcrumb">
      {items.map((item, index) => {
        const isLast = index === items.length - 1;
        return (
          <span key={`${item.label}-${index}`} className="inline-flex items-center gap-2">
            {index > 0 ? <ChevronRight className="h-4 w-4 text-white/35" /> : null}
            {item.href && !isLast ? (
              <Link href={item.href} className="pressable rounded px-1 font-semibold text-white/70 hover:text-accent">
                {item.label}
              </Link>
            ) : (
              <span className={isLast ? "font-semibold text-accent" : "font-semibold text-white/70"}>{item.label}</span>
            )}
          </span>
        );
      })}
    </nav>
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
  "focus-ring w-full rounded-md border border-line bg-white px-3 py-2 text-sm text-ink caret-ink placeholder:text-slate-400 shadow-sm outline-none [color-scheme:light] file:mr-3 file:rounded-md file:border-0 file:bg-accent file:px-3 file:py-1.5 file:text-sm file:font-semibold file:text-ink";

export function Pill({ children, tone = "neutral" }: { children: React.ReactNode; tone?: "neutral" | "green" | "blue" | "orange" }) {
  const styles = {
    neutral: "bg-slate-100 text-slate-700",
    green: "bg-emerald-50 text-emerald-700",
    blue: "bg-indigo-50 text-brand",
    orange: "bg-yellow-50 text-warn"
  };

  return <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${styles[tone]}`}>{children}</span>;
}
