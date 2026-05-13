import type { ReactNode } from "react";
import { motion, useReducedMotion } from "framer-motion";
import { motionPresets } from "@/components/motion/motion-presets";

export function PremiumJobCard({ children }: { children: ReactNode }) {
  const reduceMotion = useReducedMotion();

  return (
    <motion.article
      whileHover={reduceMotion ? undefined : motionPresets.card.hover}
      transition={motionPresets.card.transition}
      className="job-card-premium p-4"
    >
      {children}
    </motion.article>
  );
}
