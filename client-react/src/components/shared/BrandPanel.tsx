import { motion, useReducedMotion } from "framer-motion";
import type { ReactNode } from "react";
import { cn } from "@/lib/utils";
import { motionPresets } from "@/components/motion/motion-presets";

export function BrandPanel({
  children,
  className,
  floating = false,
}: {
  children: ReactNode;
  className?: string;
  floating?: boolean;
}) {
  const reduceMotion = useReducedMotion();

  return (
    <motion.section
      initial={reduceMotion ? { opacity: 1 } : motionPresets.section.enter}
      animate={
        floating && !reduceMotion
          ? { opacity: 1, y: [0, -4, 0] }
          : motionPresets.section.center
      }
      transition={
        floating && !reduceMotion
          ? { duration: 6, repeat: Infinity, ease: "easeInOut" }
          : {
              ...motionPresets.section.transition,
              duration: reduceMotion ? 0 : motionPresets.section.transition.duration,
            }
      }
      className={cn("brand-panel", className)}
    >
      <div className="relative z-10">{children}</div>
    </motion.section>
  );
}

