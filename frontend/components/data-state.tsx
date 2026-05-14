"use client";

import { AlertCircle } from "lucide-react";
import { useLanguage } from "@/lib/i18n";

export function LoadingState({ label }: { label?: string }) {
  const { t } = useLanguage();
  const resolvedLabel = label ?? t("state.loading");

  return (
    <div className="rounded-md border border-line bg-white p-4 shadow-soft" aria-live="polite" aria-label={resolvedLabel}>
      <div className="flex items-center justify-between gap-4">
        <div>
          <div className="skeleton h-4 w-36 rounded" />
          <div className="skeleton mt-3 h-3 w-56 max-w-full rounded" />
        </div>
        <div className="skeleton h-10 w-10 rounded-md" />
      </div>
      <div className="mt-5 grid gap-3 md:grid-cols-3">
        <div className="skeleton h-24 rounded-md" />
        <div className="skeleton h-24 rounded-md" />
        <div className="skeleton h-24 rounded-md" />
      </div>
      <p className="mt-4 text-sm text-muted">{resolvedLabel}</p>
      <p className="text-xs text-muted">{t("state.loadingDetails")}</p>
    </div>
  );
}

export function SkeletonGrid({ count = 6 }: { count?: number }) {
  return (
    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3" aria-hidden="true">
      {Array.from({ length: count }).map((_, index) => (
        <div key={index} className="rounded-md border border-line bg-white p-5 shadow-soft">
          <div className="flex items-start justify-between gap-4">
            <div className="w-full">
              <div className="skeleton h-4 w-2/3 rounded" />
              <div className="skeleton mt-3 h-3 w-1/2 rounded" />
            </div>
            <div className="skeleton h-7 w-20 rounded-full" />
          </div>
          <div className="skeleton mt-6 h-3 w-full rounded" />
          <div className="skeleton mt-2 h-3 w-5/6 rounded" />
        </div>
      ))}
    </div>
  );
}

export function ErrorState({ message }: { message: string }) {
  return (
    <div className="rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-danger">
      <div className="flex items-start gap-2">
        <AlertCircle className="mt-0.5 h-4 w-4" />
        <span>{message}</span>
      </div>
    </div>
  );
}

export function EmptyState({ title, description }: { title: string; description: string }) {
  return (
    <div className="rounded-md border border-dashed border-line bg-white px-6 py-10 text-center">
      <h3 className="text-base font-semibold text-ink">{title}</h3>
      <p className="mt-2 text-sm text-muted">{description}</p>
    </div>
  );
}
