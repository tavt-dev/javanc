import type { ReactNode } from "react";
import { Search, X } from "lucide-react";

export function DataToolbar({
  search,
  searchPlaceholder = "Search",
  filters,
  action,
  onSearchChange,
  onClear,
}: {
  search: string;
  searchPlaceholder?: string;
  filters?: ReactNode;
  action?: ReactNode;
  onSearchChange: (value: string) => void;
  onClear: () => void;
}) {
  return (
    <div className="flex flex-col gap-3 rounded-lg border border-border bg-card p-3 shadow-sm lg:flex-row lg:items-center lg:justify-between">
      <div className="flex min-w-0 flex-1 flex-col gap-3 sm:flex-row sm:items-center">
        <label className="relative min-w-0 flex-1">
          <span className="sr-only">{searchPlaceholder}</span>
          <Search
            size={16}
            className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
          />
          <input
            value={search}
            onChange={(event) => onSearchChange(event.target.value)}
            placeholder={searchPlaceholder}
            className="h-10 w-full rounded-md border border-input bg-background pl-9 pr-3 text-sm outline-none transition-colors focus:border-primary focus:ring-2 focus:ring-primary/20"
          />
        </label>
        {filters}
        <button
          type="button"
          onClick={onClear}
          className="inline-flex h-10 items-center justify-center gap-2 rounded-md border border-border px-3 text-sm font-medium transition-colors hover:bg-accent"
        >
          <X size={15} />
          Clear
        </button>
      </div>
      {action && <div className="shrink-0">{action}</div>}
    </div>
  );
}
