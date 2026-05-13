import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

export function PageHeader({
  title,
  description,
  actions,
  eyebrow,
  meta,
  breadcrumbs,
  search,
  density = "default",
  variant = "default",
}: {
  title: string;
  description?: string;
  actions?: ReactNode;
  eyebrow?: string;
  meta?: ReactNode;
  breadcrumbs?: ReactNode;
  search?: ReactNode;
  density?: "default" | "compact";
  variant?: "default" | "brand" | "hero" | "console" | "plain";
}) {
  if (variant === "brand" || variant === "hero" || variant === "console") {
    const isHero = variant === "hero";
    return (
      <section className={cn(isHero ? "hero-panel" : "brand-panel", "p-5 sm:p-6 lg:p-7")}>
        <div className="relative z-10 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div className="min-w-0">
            {breadcrumbs && <div className="mb-2">{breadcrumbs}</div>}
            {eyebrow && (
              <p className="mb-2 text-xs font-semibold uppercase tracking-[0.14em] text-emerald-100/85">
                {eyebrow}
              </p>
            )}
            <h1
              className={cn(
                "display-title max-w-4xl break-words font-semibold text-white",
                density === "compact"
                  ? "text-xl"
                  : isHero
                    ? "text-3xl sm:text-4xl"
                    : "text-2xl sm:text-3xl",
              )}
            >
              {title}
            </h1>
            {description && (
              <p className="mt-2 max-w-3xl text-sm leading-6 text-emerald-50/78">
                {description}
              </p>
            )}
            {meta && <div className="mt-4 flex flex-wrap gap-2">{meta}</div>}
          </div>
          {actions && (
            <div className="flex shrink-0 flex-wrap gap-2 lg:justify-end">
              {actions}
            </div>
          )}
        </div>
        {search && <div className="relative z-10 mt-5">{search}</div>}
      </section>
    );
  }

  return (
    <div
      className={cn(
        "flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between",
        density === "compact" && "gap-2",
        variant === "plain" && "border-b border-border pb-4",
      )}
    >
      <div className="min-w-0">
        {breadcrumbs && <div className="mb-2">{breadcrumbs}</div>}
        {eyebrow && (
          <p className="mb-1 text-xs font-semibold uppercase tracking-[0.12em] text-primary">
            {eyebrow}
          </p>
        )}
        <h1
          className={cn(
            "display-title break-words font-semibold text-foreground",
            density === "compact" ? "text-xl" : "text-2xl",
          )}
        >
          {title}
        </h1>
        {description && (
          <p className="mt-1 max-w-3xl text-sm text-muted-foreground">
            {description}
          </p>
        )}
        {meta && <div className="mt-3 flex flex-wrap gap-2">{meta}</div>}
      </div>
      {actions && (
        <div className="flex shrink-0 flex-wrap gap-2 sm:justify-end">
          {actions}
        </div>
      )}
    </div>
  );
}
