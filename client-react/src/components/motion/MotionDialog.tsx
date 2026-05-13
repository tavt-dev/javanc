import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { useEffect, useRef, type ReactNode } from "react";
import { motionPresets } from "./motion-presets";

export function MotionDialog({
  open,
  children,
  onClose,
  closeOnOverlayClick = true,
  className = "w-full max-w-lg",
}: {
  open: boolean;
  children: ReactNode;
  onClose?: () => void;
  closeOnOverlayClick?: boolean;
  className?: string;
}) {
  const reduceMotion = useReducedMotion();
  const panelRef = useRef<HTMLDivElement>(null);
  const previousFocusRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    if (!open) return;

    previousFocusRef.current = document.activeElement as HTMLElement | null;
    window.setTimeout(() => panelRef.current?.focus(), 0);

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        onClose?.();
      }
    }

    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      previousFocusRef.current?.focus?.();
    };
  }, [onClose, open]);

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{
            duration: reduceMotion ? 0 : motionPresets.dialog.overlayTransition.duration,
          }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/45 p-4 backdrop-blur-[2px]"
          onMouseDown={(event) => {
            if (closeOnOverlayClick && event.target === event.currentTarget) {
              onClose?.();
            }
          }}
        >
          <motion.div
            ref={panelRef}
            tabIndex={-1}
            initial={reduceMotion ? { opacity: 1 } : motionPresets.dialog.panelEnter}
            animate={motionPresets.dialog.panelCenter}
            exit={reduceMotion ? { opacity: 1 } : motionPresets.dialog.panelExit}
            transition={{
              ...motionPresets.dialog.panelTransition,
              duration: reduceMotion
                ? 0
                : motionPresets.dialog.panelTransition.duration,
            }}
            className={className}
          >
            {children}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
