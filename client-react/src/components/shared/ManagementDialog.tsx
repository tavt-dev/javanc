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
    <MotionDialog open={open}>
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="management-dialog-title"
        className="max-h-[88vh] overflow-y-auto rounded-lg border border-border bg-popover p-5 shadow-xl"
      >
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2 id="management-dialog-title" className="text-lg font-semibold">
              {title}
            </h2>
            {description && (
              <p className="mt-1 text-sm text-muted-foreground">{description}</p>
            )}
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-md p-2 text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
            aria-label="Close dialog"
          >
            <X size={18} />
          </button>
        </div>
        <div className="mt-5">{children}</div>
      </div>
    </MotionDialog>
  );
}
