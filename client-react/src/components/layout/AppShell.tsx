import { Outlet } from "react-router-dom";
import { Sidebar } from "./Sidebar";
import { Topbar } from "./Topbar";
import { MobileSidebar } from "./MobileSidebar";
import { motion, AnimatePresence, useReducedMotion } from "framer-motion";
import { useLocation } from "react-router-dom";
import { motionPresets } from "@/components/motion/motion-presets";

export function AppShell() {
  const location = useLocation();
  const reduceMotion = useReducedMotion();

  return (
    <div className="flex min-h-screen bg-background [background-image:linear-gradient(to_bottom,hsl(var(--brand-mint)/0.42),transparent_320px),linear-gradient(90deg,hsl(var(--primary)/0.04)_1px,transparent_1px)] [background-size:auto,48px_48px]">
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[100] focus:rounded-md focus:bg-primary focus:px-4 focus:py-2 focus:text-sm focus:font-medium focus:text-primary-foreground focus:shadow-lg"
      >
        Skip to content
      </a>
      <Sidebar />
      <MobileSidebar />

      <div className="flex min-w-0 flex-1 flex-col">
        <Topbar />

        <main
          id="main-content"
          tabIndex={-1}
          className="flex-1 p-4 sm:p-5 md:p-6"
        >
          <AnimatePresence mode="wait">
            <motion.div
              key={location.pathname}
              initial={reduceMotion ? { opacity: 1 } : motionPresets.page.enter}
              animate={motionPresets.page.center}
              exit={reduceMotion ? { opacity: 1 } : motionPresets.page.exit}
              transition={
                reduceMotion ? { duration: 0 } : motionPresets.page.transition
              }
              className="mx-auto w-full max-w-[1600px]"
            >
              <Outlet />
            </motion.div>
          </AnimatePresence>
        </main>
      </div>
    </div>
  );
}
