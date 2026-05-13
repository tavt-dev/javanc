import { motion, useReducedMotion } from "framer-motion";
import type { ReactNode } from "react";
import { motionPresets } from "./motion-presets";
import { cn } from "@/lib/utils";

export function PageTransition({
  children,
  className,
  variant = "default",
}: {
  children: ReactNode;
  className?: string;
  variant?: "default" | "compact" | "wide";
}) {
  const reduceMotion = useReducedMotion();

  return (
    <motion.div
      initial={reduceMotion ? { opacity: 1 } : motionPresets.page.enter}
      animate={motionPresets.page.center}
      exit={reduceMotion ? { opacity: 1 } : motionPresets.page.exit}
      transition={reduceMotion ? { duration: 0 } : motionPresets.page.transition}
      className={cn(
        "space-y-6",
        variant === "compact" && "mx-auto max-w-5xl",
        variant === "wide" && "max-w-[1600px]",
        className,
      )}
    >
      {children}
    </motion.div>
  );
}
