import { useAuthStore } from "@/stores/auth-store";
import { useUIStore } from "@/stores/ui-store";
import {
  Menu,
  Sun,
  Moon,
  Monitor,
  LogOut,
  ChevronDown,
} from "lucide-react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { useState, useRef, useEffect, useId } from "react";
import { cn } from "@/lib/utils";
import { useLogoutMutation } from "@/features/auth/hooks/use-auth-mutations";
import { NotificationBell } from "@/features/notifications/components/NotificationBell";
import { motionPresets } from "@/components/motion/motion-presets";
import { DesktopNavbar } from "./DesktopNavbar";

export function Topbar() {
  const user = useAuthStore((s) => s.user);
  const accessToken = useAuthStore((s) => s.accessToken);
  const toggleSidebar = useUIStore((s) => s.toggleSidebar);
  const theme = useUIStore((s) => s.theme);
  const setTheme = useUIStore((s) => s.setTheme);
  const logoutMutation = useLogoutMutation();

  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [themeMenuOpen, setThemeMenuOpen] = useState(false);
  const userMenuRef = useRef<HTMLDivElement>(null);
  const themeMenuRef = useRef<HTMLDivElement>(null);
  const userMenuId = useId();
  const themeMenuId = useId();
  const reduceMotion = useReducedMotion();

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (
        userMenuRef.current &&
        !userMenuRef.current.contains(e.target as Node)
      ) {
        setUserMenuOpen(false);
      }
      if (
        themeMenuRef.current &&
        !themeMenuRef.current.contains(e.target as Node)
      ) {
        setThemeMenuOpen(false);
      }
    }
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") {
        setUserMenuOpen(false);
        setThemeMenuOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, []);

  const handleLogout = () => {
    setUserMenuOpen(false);
    logoutMutation.mutate(accessToken);
  };

  const ThemeIcon = theme === "dark" ? Moon : theme === "light" ? Sun : Monitor;

  return (
    <header className="sticky top-0 z-30 flex h-[var(--nav-height)] min-w-0 items-center gap-2 border-b border-primary/10 bg-card/95 px-3 shadow-sm shadow-[hsl(var(--hero-dark)/0.05)] backdrop-blur supports-[backdrop-filter]:bg-card/88 sm:gap-3 sm:px-4 lg:px-6">
      {/* Mobile hamburger */}
      <button
        type="button"
        onClick={toggleSidebar}
        className="icon-button focus-ring lg:hidden"
        aria-label="Toggle menu"
      >
        <Menu size={20} />
      </button>

      {/* Mobile logo */}
      <div className="lg:hidden flex min-w-0 items-center gap-2">
        <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-primary shadow-sm ring-1 ring-primary/20">
          <span className="text-primary-foreground font-bold text-xs">J</span>
        </div>
        <span className="hidden min-[380px]:inline font-semibold text-sm">
          JavaNC
        </span>
      </div>

      <DesktopNavbar />

      <div className="flex-1 lg:hidden" />

      {/* Theme toggle */}
      <div className="relative" ref={themeMenuRef}>
        <button
          type="button"
          onClick={() => setThemeMenuOpen(!themeMenuOpen)}
          className="icon-button focus-ring"
          aria-label="Change theme"
          aria-expanded={themeMenuOpen}
          aria-controls={themeMenuId}
          aria-haspopup="menu"
        >
          <ThemeIcon size={18} />
        </button>
        <AnimatePresence>
          {themeMenuOpen && (
          <motion.div
            id={themeMenuId}
            role="menu"
            initial={reduceMotion ? { opacity: 1 } : motionPresets.dropdown.enter}
            animate={motionPresets.dropdown.center}
            exit={reduceMotion ? { opacity: 1 } : motionPresets.dropdown.exit}
            transition={{
              ...motionPresets.dropdown.transition,
              duration: reduceMotion ? 0 : motionPresets.dropdown.transition.duration,
            }}
            className="brand-card absolute right-0 z-50 mt-2 w-40 origin-top-right bg-popover p-1 shadow-xl"
          >
            {(["light", "dark", "system"] as const).map((t) => (
              <button
                type="button"
                key={t}
                onClick={() => {
                  setTheme(t);
                  setThemeMenuOpen(false);
                }}
                className={cn(
                  "flex w-full items-center gap-2 rounded-md px-3 py-2 text-left text-sm capitalize",
                  "transition-colors hover:bg-accent focus-visible:bg-accent focus-visible:outline-none",
                  theme === t && "text-primary font-medium",
                )}
                role="menuitem"
              >
                {t === "light" && <Sun size={14} />}
                {t === "dark" && <Moon size={14} />}
                {t === "system" && <Monitor size={14} />}
                {t}
              </button>
            ))}
          </motion.div>
          )}
        </AnimatePresence>
      </div>

      <NotificationBell />

      {/* User menu */}
      <div className="relative" ref={userMenuRef}>
        <button
          type="button"
          onClick={() => setUserMenuOpen(!userMenuOpen)}
          className="focus-ring flex min-w-0 items-center gap-2 rounded-md p-1.5 pr-2 transition-colors hover:bg-accent"
          aria-label="Open user menu"
          aria-expanded={userMenuOpen}
          aria-controls={userMenuId}
          aria-haspopup="menu"
        >
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/10 ring-1 ring-primary/15">
            <span className="text-primary text-sm font-semibold">
              {user?.name?.charAt(0)?.toUpperCase() || "U"}
            </span>
          </div>
          <div className="hidden sm:block text-left">
            <p className="text-sm font-medium leading-none truncate max-w-[120px]">
              {user?.name || "User"}
            </p>
            <p className="text-xs text-muted-foreground capitalize">
              {user?.role || "user"}
            </p>
          </div>
          <ChevronDown size={14} className="text-muted-foreground" />
        </button>

        <AnimatePresence>
          {userMenuOpen && (
          <motion.div
            id={userMenuId}
            role="menu"
            initial={reduceMotion ? { opacity: 1 } : motionPresets.dropdown.enter}
            animate={motionPresets.dropdown.center}
            exit={reduceMotion ? { opacity: 1 } : motionPresets.dropdown.exit}
            transition={{
              ...motionPresets.dropdown.transition,
              duration: reduceMotion ? 0 : motionPresets.dropdown.transition.duration,
            }}
            className="brand-card absolute right-0 z-50 mt-2 w-56 origin-top-right bg-popover p-1 shadow-xl"
          >
            <div className="border-b border-border px-3 py-2">
              <p className="text-sm font-medium truncate">{user?.name}</p>
              <p className="text-xs text-muted-foreground truncate">
                {user?.email}
              </p>
            </div>
            <button
              type="button"
              onClick={handleLogout}
              disabled={logoutMutation.isPending}
              className="flex w-full items-center gap-2 rounded-md px-3 py-2 text-left text-sm text-destructive transition-colors hover:bg-accent focus-visible:bg-accent focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-70"
              role="menuitem"
            >
              <LogOut size={14} />
              {logoutMutation.isPending ? "Logging out..." : "Logout"}
            </button>
          </motion.div>
          )}
        </AnimatePresence>
      </div>
    </header>
  );
}
