import { motion, useReducedMotion } from "framer-motion";
import type { ReactNode } from "react";
import { motionPresets } from "./motion-presets";

export function StaggerList({
  children,
  className,
  limit = 12,
  delay = 0,
}: {
  children: ReactNode;
  className?: string;
  limit?: number;
  delay?: number;
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
            delayChildren: reduceMotion ? 0 : delay,
          },
        },
      }}
      data-stagger-limit={limit}
      className={className}
    >
      {children}
    </motion.div>
  );
}

export function StaggerItem({
  children,
  className,
  index = 0,
  limit = 12,
}: {
  children: ReactNode;
  className?: string;
  index?: number;
  limit?: number;
}) {
  const reduceMotion = useReducedMotion();
  const shouldAnimate = !reduceMotion && index < limit;

  return (
    <motion.div
      variants={{
        hidden: shouldAnimate ? motionPresets.list.itemEnter : { opacity: 1 },
        show: motionPresets.list.itemCenter,
      }}
      transition={{
        ...motionPresets.list.itemTransition,
        duration: shouldAnimate ? motionPresets.list.itemTransition.duration : 0,
      }}
      className={className}
    >
      {children}
    </motion.div>
  );
}
