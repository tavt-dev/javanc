import { AlertTriangle, Loader2 } from "lucide-react";
import { MotionDialog } from "@/components/motion/MotionDialog";

export function ConfirmDialog({
  open,
  title,
  description,
  confirmLabel = "Confirm",
  cancelLabel = "Cancel",
  destructive = false,
  loading = false,
  onConfirm,
  onCancel,
}: {
  open: boolean;
  title: string;
  description: string;
  confirmLabel?: string;
  cancelLabel?: string;
  destructive?: boolean;
  loading?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  return (
    <MotionDialog open={open} onClose={onCancel} className="w-full max-w-md">
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="confirm-dialog-title"
        aria-describedby="confirm-dialog-description"
        className="surface max-h-[calc(100dvh-2rem)] overflow-y-auto bg-popover p-6 shadow-2xl"
      >
        <div className="flex gap-3">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-destructive/10 ring-1 ring-destructive/20">
            <AlertTriangle size={20} className="text-destructive" />
          </div>
          <div className="min-w-0">
            <h2
              id="confirm-dialog-title"
              className="text-lg font-semibold text-foreground"
            >
              {title}
            </h2>
            <p
              id="confirm-dialog-description"
              className="mt-2 text-sm text-muted-foreground"
            >
              {description}
            </p>
          </div>
        </div>

        <div className="mt-6 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          <button
            type="button"
            onClick={onCancel}
            disabled={loading}
            className="btn-secondary focus-ring"
          >
            {cancelLabel}
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={loading}
            className={
              destructive
                ? "btn-danger focus-ring min-w-28"
                : "btn-primary focus-ring min-w-28"
            }
          >
            {loading && <Loader2 size={16} className="animate-spin" />}
            {confirmLabel}
          </button>
        </div>
      </div>
    </MotionDialog>
  );
}
