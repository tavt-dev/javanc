export const motionPresets = {
  page: {
    enter: { opacity: 0, y: 8 },
    center: { opacity: 1, y: 0 },
    exit: { opacity: 0, y: -4 },
    transition: { duration: 0.22, ease: [0.2, 0, 0, 1] },
  },
  section: {
    enter: { opacity: 0, y: 6 },
    center: { opacity: 1, y: 0 },
    transition: { duration: 0.18, ease: [0.2, 0, 0, 1] },
  },
  fadeIn: {
    enter: { opacity: 0, y: 6 },
    center: { opacity: 1, y: 0 },
    transition: { duration: 0.18, ease: [0.2, 0, 0, 1] },
  },
  card: {
    hover: { y: -1 },
    transition: { duration: 0.16, ease: [0.2, 0, 0, 1] },
  },
  dialog: {
    overlayTransition: { duration: 0.15 },
    panelEnter: { opacity: 0, scale: 0.98 },
    panelCenter: { opacity: 1, scale: 1 },
    panelExit: { opacity: 0, scale: 0.98 },
    panelTransition: { duration: 0.18, ease: [0.2, 0, 0, 1] },
  },
  list: {
    staggerChildren: 0.035,
    itemEnter: { opacity: 0, y: 8 },
    itemCenter: { opacity: 1, y: 0 },
    itemTransition: { duration: 0.18, ease: [0.2, 0, 0, 1] },
  },
  dropdown: {
    enter: { opacity: 0, scale: 0.98 },
    center: { opacity: 1, scale: 1 },
    exit: { opacity: 0, scale: 0.98 },
    transition: { duration: 0.14, ease: [0.2, 0, 0, 1] },
  },
  toast: {
    enter: { opacity: 0, y: 4 },
    center: { opacity: 1, y: 0 },
    exit: { opacity: 0, y: -2 },
    transition: { duration: 0.14, ease: [0.2, 0, 0, 1] },
  },
} as const;
