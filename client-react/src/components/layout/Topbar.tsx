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
import { useState, useRef, useEffect } from "react";
import { cn } from "@/lib/utils";
import { useLogoutMutation } from "@/features/auth/hooks/use-auth-mutations";
import { NotificationBell } from "@/features/notifications/components/NotificationBell";

export function Topbar() {
  const user = useAuthStore((s) => s.user);
  const toggleSidebar = useUIStore((s) => s.toggleSidebar);
  const theme = useUIStore((s) => s.theme);
  const setTheme = useUIStore((s) => s.setTheme);
  const logoutMutation = useLogoutMutation();

  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [themeMenuOpen, setThemeMenuOpen] = useState(false);
  const userMenuRef = useRef<HTMLDivElement>(null);
  const themeMenuRef = useRef<HTMLDivElement>(null);

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
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleLogout = () => {
    logoutMutation.mutate();
  };

  const ThemeIcon = theme === "dark" ? Moon : theme === "light" ? Sun : Monitor;

  return (
    <header className="h-16 border-b border-border bg-card flex items-center px-4 gap-3 sticky top-0 z-30">
      {/* Mobile hamburger */}
      <button
        onClick={toggleSidebar}
        className="lg:hidden p-2 rounded-md hover:bg-accent transition-colors"
        aria-label="Toggle menu"
      >
        <Menu size={20} />
      </button>

      {/* Mobile logo */}
      <div className="lg:hidden flex items-center gap-2">
        <div className="w-7 h-7 rounded-lg bg-primary flex items-center justify-center">
          <span className="text-primary-foreground font-bold text-xs">J</span>
        </div>
        <span className="font-semibold text-sm">JavaNC</span>
      </div>

      <div className="flex-1" />

      {/* Theme toggle */}
      <div className="relative" ref={themeMenuRef}>
        <button
          onClick={() => setThemeMenuOpen(!themeMenuOpen)}
          className="p-2 rounded-md hover:bg-accent text-muted-foreground
                     hover:text-foreground transition-colors"
          aria-label="Change theme"
        >
          <ThemeIcon size={18} />
        </button>
        {themeMenuOpen && (
          <div className="absolute right-0 mt-1 w-36 bg-popover border border-border rounded-lg shadow-lg py-1 z-50">
            {(["light", "dark", "system"] as const).map((t) => (
              <button
                key={t}
                onClick={() => {
                  setTheme(t);
                  setThemeMenuOpen(false);
                }}
                className={cn(
                  "w-full text-left px-3 py-2 text-sm flex items-center gap-2",
                  "hover:bg-accent transition-colors capitalize",
                  theme === t && "text-primary font-medium",
                )}
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
          onClick={() => setUserMenuOpen(!userMenuOpen)}
          className="flex items-center gap-2 p-1.5 pr-2 rounded-md hover:bg-accent transition-colors"
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
          <div className="absolute right-0 mt-1 w-48 bg-popover border border-border rounded-lg shadow-lg py-1 z-50">
            <div className="px-3 py-2 border-b border-border">
              <p className="text-sm font-medium truncate">{user?.name}</p>
              <p className="text-xs text-muted-foreground truncate">
                {user?.email}
              </p>
            </div>
            <button
              onClick={handleLogout}
              disabled={logoutMutation.isPending}
              className="w-full text-left px-3 py-2 text-sm text-destructive
                         hover:bg-accent transition-colors flex items-center gap-2
                         disabled:cursor-not-allowed disabled:opacity-70"
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
