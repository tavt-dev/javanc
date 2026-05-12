import { motion, useReducedMotion } from "framer-motion";
import type { ReactNode } from "react";
import { motionPresets } from "./motion-presets";

export function StaggerList({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  const reduceMotion = useReducedMotion();

  return (
    <motion.div
      initial="hidden"
      animate="show"
      variants={{
        hidden: {},
        show: {
          transition: {
            staggerChildren: reduceMotion ? 0 : motionPresets.list.staggerChildren,
          },
        },
      }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

export function StaggerItem({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  const reduceMotion = useReducedMotion();

  return (
    <motion.div
      variants={{
        hidden: reduceMotion ? { opacity: 1 } : motionPresets.list.itemEnter,
        show: motionPresets.list.itemCenter,
      }}
      transition={{
        ...motionPresets.list.itemTransition,
        duration: reduceMotion ? 0 : motionPresets.list.itemTransition.duration,
      }}
      className={className}
    >
      {children}
    </motion.div>
  );
}
