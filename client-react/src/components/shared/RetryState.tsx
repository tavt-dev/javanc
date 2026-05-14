import { AlertCircle, RefreshCcw } from "lucide-react";
import { extractErrorMessage } from "@/lib/api-error";
import { useTranslation } from "react-i18next";

export function RetryState({
  error,
  onRetry,
  title,
  description,
}: {
  error: unknown;
  onRetry: () => void;
  title?: string;
  description?: string;
}) {
  const { t } = useTranslation();
  return (
    <div className="surface p-6">
      <div className="flex items-start gap-3">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-destructive/10 text-destructive">
          <AlertCircle size={20} />
        </div>
        <div className="min-w-0">
          <h2 className="text-lg font-semibold text-foreground">
            {title ?? t("errors.generic")}
          </h2>
          <p className="mt-1 text-sm text-muted-foreground">
            {description ?? extractErrorMessage(error)}
          </p>
        </div>
      </div>
      <button
        type="button"
        onClick={onRetry}
        className="btn-primary focus-ring mt-5"
      >
        <RefreshCcw size={16} />
        {t("common.retry")}
      </button>
    </div>
  );
}
