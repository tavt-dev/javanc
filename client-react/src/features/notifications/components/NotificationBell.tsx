import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { Bell } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { EmptyState } from "@/components/shared/EmptyState";
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
        className="relative rounded-md p-2 text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
        aria-label="Notifications"
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
            initial={reduceMotion ? { opacity: 1 } : { opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={reduceMotion ? { opacity: 1 } : { opacity: 0, scale: 0.98 }}
            transition={{ duration: reduceMotion ? 0 : 0.15, ease: "easeOut" }}
            className="absolute right-0 z-50 mt-2 w-[min(360px,calc(100vw-2rem))] origin-top-right rounded-lg border border-border bg-popover p-3 shadow-xl"
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

            <div className="max-h-[420px] space-y-2 overflow-y-auto">
              {notificationsQuery.isLoading ? (
                <div className="rounded-lg bg-muted p-4 text-sm text-muted-foreground">
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
