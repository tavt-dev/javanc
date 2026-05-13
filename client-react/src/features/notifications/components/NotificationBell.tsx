import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { Bell } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { EmptyState } from "@/components/shared/EmptyState";
import { motionPresets } from "@/components/motion/motion-presets";
import { NotificationItem } from "@/features/notifications/components/NotificationItem";
import {
  useMarkNotificationReadMutation,
  useNotificationsQuery,
} from "@/features/notifications/hooks/use-notification-queries";
import { useAuthStore } from "@/stores/auth-store";

export function NotificationBell() {
  const user = useAuthStore((s) => s.user);
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const dropdownId = "notification-dropdown";
  const reduceMotion = useReducedMotion();
  const notificationsQuery = useNotificationsQuery(user?.id);
  const markReadMutation = useMarkNotificationReadMutation(user?.id ?? 0);
  const latest = notificationsQuery.notifications.slice(0, 5);

  useEffect(() => {
    function handlePointerDown(event: MouseEvent) {
      if (!rootRef.current?.contains(event.target as Node)) {
        setOpen(false);
      }
    }
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") setOpen(false);
    }
    document.addEventListener("mousedown", handlePointerDown);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("mousedown", handlePointerDown);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, []);

  return (
    <div className="relative" ref={rootRef}>
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        className="icon-button focus-ring relative"
        aria-label="Notifications"
        aria-expanded={open}
        aria-controls={dropdownId}
        aria-haspopup="dialog"
      >
        <Bell size={18} />
        {notificationsQuery.unreadCount > 0 && (
          <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-destructive px-1 text-[10px] font-semibold leading-none text-destructive-foreground">
            {notificationsQuery.unreadCount > 9
              ? "9+"
              : notificationsQuery.unreadCount}
          </span>
        )}
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            id={dropdownId}
            role="dialog"
            aria-label="Notifications"
            initial={reduceMotion ? { opacity: 1 } : motionPresets.dropdown.enter}
            animate={motionPresets.dropdown.center}
            exit={reduceMotion ? { opacity: 1 } : motionPresets.dropdown.exit}
            transition={{
              ...motionPresets.dropdown.transition,
              duration: reduceMotion ? 0 : motionPresets.dropdown.transition.duration,
            }}
            className="surface absolute right-0 z-50 mt-2 w-[min(380px,calc(100vw-2rem))] origin-top-right bg-popover p-3 shadow-xl"
          >
            <div className="mb-3 flex items-center justify-between gap-3 px-1">
              <div>
                <p className="text-sm font-semibold">Notifications</p>
                <p className="text-xs text-muted-foreground">
                  {notificationsQuery.unreadCount} unread
                </p>
              </div>
              <Link
                to="/notifications"
                onClick={() => setOpen(false)}
                className="text-sm font-medium text-primary hover:underline"
              >
                View all
              </Link>
            </div>

            <div className="premium-scrollbar max-h-[420px] space-y-2 overflow-y-auto">
              {notificationsQuery.isLoading ? (
                <div className="surface-muted p-4 text-sm text-muted-foreground">
                  Loading notifications...
                </div>
              ) : latest.length === 0 ? (
                <EmptyState
                  icon={Bell}
                  title="No notifications"
                  description="New updates will appear here."
                />
              ) : (
                latest.map((notification) => (
                  <NotificationItem
                    key={notification.id}
                    notification={notification}
                    compact
                    marking={markReadMutation.isPending}
                    onMarkRead={(item) => markReadMutation.mutate(item)}
                  />
                ))
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
