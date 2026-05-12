import { motion, useReducedMotion } from "framer-motion";
import type { ReactNode } from "react";
import { motionPresets } from "./motion-presets";

export function FadeIn({
  children,
  delay = 0,
  className,
}: {
  children: ReactNode;
  delay?: number;
  className?: string;
}) {
  const reduceMotion = useReducedMotion();

  return (
    <motion.div
      initial={reduceMotion ? { opacity: 1 } : motionPresets.fadeIn.enter}
      animate={motionPresets.fadeIn.center}
      transition={{
        ...motionPresets.fadeIn.transition,
        duration: reduceMotion ? 0 : motionPresets.fadeIn.transition.duration,
        delay: reduceMotion ? 0 : delay,
      }}
      className={className}
    >
      {children}
    </motion.div>
  );
}
