import type { LucideIcon } from "lucide-react";
import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

export function EmptyState({
  icon: Icon,
  title,
  description,
  action,
  compact = false,
  variant = "default",
}: {
  icon: LucideIcon;
  title: string;
  description: string;
  action?: ReactNode;
  compact?: boolean;
  variant?: "default" | "brand";
}) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center rounded-lg border border-dashed text-center shadow-sm",
        variant === "brand"
          ? "border-primary/25 bg-[hsl(var(--brand-mint)/0.28)]"
          : "border-border bg-card",
        compact ? "min-h-32 px-4 py-6" : "min-h-[240px] px-6 py-12",
      )}
    >
      <div
        className={cn(
          "mb-4 flex items-center justify-center rounded-lg bg-primary/10 text-primary ring-1 ring-primary/10",
          compact ? "h-10 w-10" : "h-12 w-12",
        )}
      >
        <Icon size={compact ? 18 : 22} />
      </div>
      <h2
        className={cn(
          "font-semibold text-foreground",
          compact ? "text-base" : "text-lg",
        )}
      >
        {title}
      </h2>
      <p className="mt-2 max-w-md text-sm text-muted-foreground">
        {description}
      </p>
      {action && <div className="mt-5">{action}</div>}
    </div>
  );
}
