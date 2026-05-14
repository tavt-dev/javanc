"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import type { ComponentProps } from "react";
import { ArrowLeft, ChevronLeft, ChevronRight } from "lucide-react";
import { useLanguage } from "@/lib/i18n";

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

export function BackButton({ href, label }: { href?: string; label?: string }) {
  const router = useRouter();
  const { t } = useLanguage();
  const resolvedLabel = label ?? t("common.back");

  if (href) {
    return (
      <LinkButton href={href} variant="secondary" className="gap-2">
        <ArrowLeft className="h-4 w-4" />
        {resolvedLabel}
      </LinkButton>
    );
  }

  return (
    <Button type="button" variant="secondary" className="gap-2" onClick={() => router.back()}>
      <ArrowLeft className="h-4 w-4" />
      {resolvedLabel}
    </Button>
  );
}

export function Breadcrumbs({ items }: { items: Array<{ label: string; href?: string }> }) {
  const { t } = useLanguage();

  return (
    <nav className="mb-4 flex flex-wrap items-center gap-2 text-sm" aria-label={t("common.breadcrumb")}>
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

export const glassInputClass =
  "focus-ring w-full rounded-md border border-white/15 bg-white/10 px-3 py-2 text-sm text-white caret-accent placeholder:text-white/45 shadow-sm outline-none [color-scheme:dark] file:mr-3 file:rounded-md file:border-0 file:bg-accent file:px-3 file:py-1.5 file:text-sm file:font-semibold file:text-ink";

export function Pill({ children, tone = "neutral" }: { children: React.ReactNode; tone?: "neutral" | "green" | "blue" | "orange" }) {
  const styles = {
    neutral: "bg-slate-100 text-slate-700",
    green: "bg-emerald-50 text-emerald-700",
    blue: "bg-indigo-50 text-brand",
    orange: "bg-yellow-50 text-warn"
  };

  return <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${styles[tone]}`}>{children}</span>;
}

export function PaginationControls({
  page,
  canNext,
  onPageChange,
  className = ""
}: {
  page: number;
  canNext: boolean;
  onPageChange: (page: number) => void;
  className?: string;
}) {
  return (
    <div
      className={`mt-5 flex items-center justify-center gap-2 ${className}`}
      aria-label="Pagination"
    >
      <button
        type="button"
        className="focus-ring pressable inline-flex h-8 w-8 items-center justify-center rounded-md border border-white/15 bg-white/10 text-white/80 shadow-sm backdrop-blur transition hover:border-accent/50 hover:bg-white/15 hover:text-accent disabled:pointer-events-none disabled:opacity-35"
        onClick={() => onPageChange(Math.max(0, page - 1))}
        disabled={page === 0}
        aria-label="Previous page"
      >
        <ChevronLeft className="h-4 w-4" />
      </button>
      <span className="inline-flex h-8 min-w-14 items-center justify-center rounded-md border border-white/10 bg-white/10 px-3 text-xs font-semibold text-white/75 backdrop-blur">
        {page + 1}
      </span>
      <button
        type="button"
        className="focus-ring pressable inline-flex h-8 w-8 items-center justify-center rounded-md border border-white/15 bg-white/10 text-white/80 shadow-sm backdrop-blur transition hover:border-accent/50 hover:bg-white/15 hover:text-accent disabled:pointer-events-none disabled:opacity-35"
        onClick={() => onPageChange(page + 1)}
        disabled={!canNext}
        aria-label="Next page"
      >
        <ChevronRight className="h-4 w-4" />
      </button>
    </div>
  );
}
