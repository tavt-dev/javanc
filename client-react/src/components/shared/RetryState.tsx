import { RefreshCcw } from "lucide-react";
import { extractErrorMessage } from "@/lib/api-error";

export function RetryState({
  error,
  onRetry,
  title = "Unable to load data",
}: {
  error: unknown;
  onRetry: () => void;
  title?: string;
}) {
  return (
    <div className="rounded-lg border border-border bg-card p-6">
      <h2 className="text-lg font-semibold text-foreground">{title}</h2>
      <p className="mt-2 text-sm text-muted-foreground">
        {extractErrorMessage(error)}
      </p>
      <button
        type="button"
        onClick={onRetry}
        className="mt-4 inline-flex items-center gap-2 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
      >
        <RefreshCcw size={16} />
        Retry
      </button>
    </div>
  );
}
