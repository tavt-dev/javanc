import { motion, useReducedMotion } from "framer-motion";
import type { ReactNode } from "react";
import { motionPresets } from "./motion-presets";

type FadeInVariant = "fade" | "section";

export function FadeIn({
  children,
  delay = 0,
  className,
  variant = "fade",
}: {
  children: ReactNode;
  delay?: number;
  className?: string;
  variant?: FadeInVariant;
}) {
  const reduceMotion = useReducedMotion();
  const preset =
    variant === "section" ? motionPresets.section : motionPresets.fadeIn;

  return (
    <motion.div
      initial={reduceMotion ? { opacity: 1 } : preset.enter}
      animate={preset.center}
      transition={{
        ...preset.transition,
        duration: reduceMotion ? 0 : preset.transition.duration,
        delay: reduceMotion ? 0 : delay,
      }}
      className={className}
    >
      {children}
    </motion.div>
  );
}
