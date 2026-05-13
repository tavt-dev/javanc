import type { ReactNode } from "react";
import { SearchHeroPanel } from "./SearchHeroPanel";

export function HeroSearchSection({
  title,
  description,
  value,
  placeholder,
  onChange,
  filters,
  action,
}: {
  title?: string;
  description?: string;
  value: string;
  placeholder: string;
  onChange: (value: string) => void;
  filters?: ReactNode;
  action?: ReactNode;
}) {
  return (
    <section className="job-search-panel p-4 sm:p-5">
      {(title || description) && (
        <div className="mb-4">
          {title && (
            <h2 className="display-title text-lg font-semibold text-foreground">
              {title}
            </h2>
          )}
          {description && (
            <p className="mt-1 text-sm text-muted-foreground">{description}</p>
          )}
        </div>
      )}
      <SearchHeroPanel
        value={value}
        placeholder={placeholder}
        onChange={onChange}
        filters={filters}
        action={action}
      />
    </section>
  );
}
