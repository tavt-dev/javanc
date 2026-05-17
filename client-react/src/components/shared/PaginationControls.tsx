import { ChevronLeft, ChevronRight } from "lucide-react";
import type { PageResponse } from "@/types/api";

export function PaginationControls<T>({
  page,
  onPageChange,
  onSizeChange,
}: {
  page: PageResponse<T>;
  onPageChange: (nextPage: number) => void;
  onSizeChange: (nextSize: number) => void;
}) {
  return (
    <div className="flex flex-col gap-3 border-t border-border pt-4 sm:flex-row sm:items-center sm:justify-between">
      <p className="text-sm text-muted-foreground">
        Page {page.totalPages === 0 ? 0 : page.page + 1} of {page.totalPages} - {page.totalElements} results
      </p>
      <div className="flex flex-wrap items-center gap-2">
        <label className="inline-flex items-center gap-2 text-sm text-muted-foreground">
          <span>Rows</span>
          <select
            value={page.size}
            onChange={(event) => onSizeChange(Number(event.target.value))}
            className="form-input h-9 w-20"
          >
            {[10, 20, 50, 100].map((size) => (
              <option key={size} value={size}>
                {size}
              </option>
            ))}
          </select>
        </label>
        <button
          type="button"
          className="icon-button focus-ring"
          disabled={!page.hasPrevious}
          onClick={() => onPageChange(page.page - 1)}
          aria-label="Previous page"
        >
          <ChevronLeft size={16} />
        </button>
        <button
          type="button"
          className="icon-button focus-ring"
          disabled={!page.hasNext}
          onClick={() => onPageChange(page.page + 1)}
          aria-label="Next page"
        >
          <ChevronRight size={16} />
        </button>
      </div>
    </div>
  );
}
