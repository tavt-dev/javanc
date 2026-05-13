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
import { useState, useRef, useEffect, useId } from "react";
import { cn } from "@/lib/utils";
import { useLogoutMutation } from "@/features/auth/hooks/use-auth-mutations";
import { NotificationBell } from "@/features/notifications/components/NotificationBell";

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
    <header className="h-16 border-b border-border bg-card flex min-w-0 items-center px-3 sm:px-4 gap-2 sm:gap-3 sticky top-0 z-30">
      {/* Mobile hamburger */}
      <button
        type="button"
        onClick={toggleSidebar}
        className="lg:hidden p-2 rounded-md hover:bg-accent transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
        aria-label="Toggle menu"
      >
        <Menu size={20} />
      </button>

      {/* Mobile logo */}
      <div className="lg:hidden flex min-w-0 items-center gap-2">
        <div className="w-7 h-7 rounded-lg bg-primary flex items-center justify-center">
          <span className="text-primary-foreground font-bold text-xs">J</span>
        </div>
        <span className="hidden min-[380px]:inline font-semibold text-sm">
          JavaNC
        </span>
      </div>

      <div className="flex-1" />

      {/* Theme toggle */}
      <div className="relative" ref={themeMenuRef}>
        <button
          type="button"
          onClick={() => setThemeMenuOpen(!themeMenuOpen)}
          className="p-2 rounded-md hover:bg-accent text-muted-foreground
                     hover:text-foreground transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
          aria-label="Change theme"
          aria-expanded={themeMenuOpen}
          aria-controls={themeMenuId}
          aria-haspopup="menu"
        >
          <ThemeIcon size={18} />
        </button>
        {themeMenuOpen && (
          <div
            id={themeMenuId}
            role="menu"
            className="absolute right-0 mt-1 w-36 bg-popover border border-border rounded-lg shadow-lg py-1 z-50"
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
                  "w-full text-left px-3 py-2 text-sm flex items-center gap-2",
                  "hover:bg-accent transition-colors capitalize focus-visible:outline-none focus-visible:bg-accent",
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
          </div>
        )}
      </div>

      <NotificationBell />

      {/* User menu */}
      <div className="relative" ref={userMenuRef}>
        <button
          type="button"
          onClick={() => setUserMenuOpen(!userMenuOpen)}
          className="flex min-w-0 items-center gap-2 p-1.5 pr-2 rounded-md hover:bg-accent transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
          aria-label="Open user menu"
          aria-expanded={userMenuOpen}
          aria-controls={userMenuId}
          aria-haspopup="menu"
        >
          <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
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

        {userMenuOpen && (
          <div
            id={userMenuId}
            role="menu"
            className="absolute right-0 mt-1 w-48 bg-popover border border-border rounded-lg shadow-lg py-1 z-50"
          >
            <div className="px-3 py-2 border-b border-border">
              <p className="text-sm font-medium truncate">{user?.name}</p>
              <p className="text-xs text-muted-foreground truncate">
                {user?.email}
              </p>
            </div>
            <button
              type="button"
              onClick={handleLogout}
              disabled={logoutMutation.isPending}
              className="w-full text-left px-3 py-2 text-sm text-destructive
                         hover:bg-accent transition-colors flex items-center gap-2
                         focus-visible:outline-none focus-visible:bg-accent
                         disabled:cursor-not-allowed disabled:opacity-70"
              role="menuitem"
            >
              <LogOut size={14} />
              {logoutMutation.isPending ? "Logging out..." : "Logout"}
            </button>
          </div>
        )}
      </div>
    </header>
  );
}
