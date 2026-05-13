import type { ReactNode } from "react";
import { X } from "lucide-react";
import { MotionDialog } from "@/components/motion/MotionDialog";

export function ManagementDialog({
  open,
  title,
  description,
  children,
  onClose,
}: {
  open: boolean;
  title: string;
  description?: string;
  children: ReactNode;
  onClose: () => void;
}) {
  return (
    <MotionDialog open={open} onClose={onClose} className="w-full max-w-2xl">
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="management-dialog-title"
        aria-describedby={description ? "management-dialog-description" : undefined}
        className="surface flex max-h-[calc(100dvh-2rem)] flex-col overflow-hidden bg-popover shadow-2xl"
      >
        <div className="flex items-start justify-between gap-4 border-b border-border px-5 py-4">
          <div className="min-w-0">
            <h2 id="management-dialog-title" className="text-lg font-semibold">
              {title}
            </h2>
            {description && (
              <p
                id="management-dialog-description"
                className="mt-1 text-sm text-muted-foreground"
              >
                {description}
              </p>
            )}
          </div>
          <button
            type="button"
            onClick={onClose}
            className="icon-button focus-ring shrink-0"
            aria-label="Close dialog"
          >
            <X size={18} />
          </button>
        </div>
        <div className="premium-scrollbar overflow-y-auto px-5 py-5">
          {children}
        </div>
      </div>
    </MotionDialog>
  );
}
