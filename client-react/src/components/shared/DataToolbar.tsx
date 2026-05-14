import type { ReactNode } from "react";
import { Search, X } from "lucide-react";
import { useTranslation } from "react-i18next";

export function DataToolbar({
  search,
  searchPlaceholder,
  filters,
  action,
  onSearchChange,
  onClear,
  activeFilterCount = 0,
  variant = "default",
}: {
  search: string;
  searchPlaceholder?: string;
  filters?: ReactNode;
  action?: ReactNode;
  onSearchChange: (value: string) => void;
  onClear: () => void;
  activeFilterCount?: number;
  variant?: "default" | "prominent" | "job-search";
}) {
  const { t } = useTranslation();
  const placeholder = searchPlaceholder ?? t("common.search");
  const elevated = variant === "prominent" || variant === "job-search";
  return (
    <div
      className={
        variant === "job-search"
          ? "job-search-panel flex flex-col gap-3 p-3 sm:p-4 lg:flex-row lg:items-center lg:justify-between"
          : elevated
            ? "brand-search flex flex-col gap-3 p-3 lg:flex-row lg:items-center lg:justify-between"
          : "surface flex flex-col gap-3 p-3 lg:flex-row lg:items-center lg:justify-between"
      }
    >
      <div className="flex min-w-0 flex-1 flex-col gap-3 sm:flex-row sm:items-center">
        <label className="relative min-w-0 flex-1">
          <span className="sr-only">{placeholder}</span>
          <Search
            size={16}
            className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
          />
          <input
            value={search}
            onChange={(event) => onSearchChange(event.target.value)}
            placeholder={placeholder}
            className={elevated ? "form-input h-11 pl-9" : "form-input h-10 pl-9"}
          />
        </label>
        {filters}
        <button
          type="button"
          onClick={onClear}
          aria-label={t("common.clear")}
          className="btn-secondary focus-ring h-10"
        >
          <X size={15} />
          {t("common.clear")}
          {activeFilterCount > 0 && (
            <span className="ml-1 rounded-full bg-primary/10 px-1.5 py-0.5 text-[11px] text-primary">
              {activeFilterCount}
            </span>
          )}
        </button>
      </div>
      {action && <div className="flex shrink-0 flex-wrap gap-2">{action}</div>}
    </div>
  );
}
