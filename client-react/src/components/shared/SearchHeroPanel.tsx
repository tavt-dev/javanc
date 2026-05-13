import { Search } from "lucide-react";
import type { ReactNode } from "react";

export function SearchHeroPanel({
  value,
  placeholder,
  onChange,
  filters,
  action,
}: {
  value: string;
  placeholder: string;
  onChange: (value: string) => void;
  filters?: ReactNode;
  action?: ReactNode;
}) {
  return (
    <div className="job-search-panel p-3">
      <div className="grid gap-3 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-center">
        <label className="relative block min-w-0">
          <span className="sr-only">{placeholder}</span>
          <Search
            size={18}
            className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-primary"
          />
          <input
            value={value}
            onChange={(event) => onChange(event.target.value)}
            placeholder={placeholder}
            className="form-input h-12 rounded-lg pl-11 text-[0.95rem]"
          />
        </label>
        {action}
      </div>
      {filters && (
        <div className="mt-3 flex flex-col gap-3 md:flex-row md:flex-wrap md:items-center">
          {filters}
        </div>
      )}
    </div>
  );
}
