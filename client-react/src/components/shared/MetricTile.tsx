import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

export function MetricTile({
  icon: Icon,
  label,
  value,
  detail,
  variant = "light",
}: {
  icon?: LucideIcon;
  label: string;
  value: string | number;
  detail?: string;
  variant?: "light" | "dark";
}) {
  return (
    <div
      className={cn(
        variant === "dark" ? "brand-metric p-4" : "brand-card p-4",
        "min-w-0",
      )}
    >
      <div className="flex items-center justify-between gap-3">
        <p
          className={cn(
            "truncate text-sm",
            variant === "dark" ? "text-emerald-50/75" : "text-muted-foreground",
          )}
        >
          {label}
        </p>
        {Icon && (
          <Icon
            size={17}
            className={variant === "dark" ? "text-emerald-100/75" : "text-primary"}
          />
        )}
      </div>
      <p
        className={cn(
          "mt-2 truncate text-2xl font-semibold",
          variant === "dark" ? "text-white" : "text-foreground",
        )}
      >
        {value}
      </p>
      {detail && (
        <p
          className={cn(
            "mt-1 truncate text-xs",
            variant === "dark" ? "text-emerald-50/62" : "text-muted-foreground",
          )}
        >
          {detail}
        </p>
      )}
    </div>
  );
}

