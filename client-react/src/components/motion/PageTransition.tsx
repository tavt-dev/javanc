import { motion, useReducedMotion } from "framer-motion";
import type { ReactNode } from "react";
import { motionPresets } from "./motion-presets";

export function PageTransition({ children }: { children: ReactNode }) {
  const reduceMotion = useReducedMotion();

  return (
    <motion.div
      initial={reduceMotion ? { opacity: 1 } : motionPresets.page.enter}
      animate={motionPresets.page.center}
      exit={reduceMotion ? { opacity: 1 } : motionPresets.page.exit}
      transition={reduceMotion ? { duration: 0 } : motionPresets.page.transition}
      className="space-y-6"
    >
      {children}
    </motion.div>
  );
}
