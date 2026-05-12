import { Bell } from "lucide-react";
import { useMemo, useState } from "react";
import { PageTransition } from "@/components/motion/PageTransition";
import { EmptyState } from "@/components/shared/EmptyState";
import { LoadingSkeleton } from "@/components/shared/LoadingSkeleton";
import { PageHeader } from "@/components/shared/PageHeader";
import { RetryState } from "@/components/shared/RetryState";
import { NotificationItem } from "@/features/notifications/components/NotificationItem";
import {
  useMarkNotificationReadMutation,
  useNotificationsQuery,
} from "@/features/notifications/hooks/use-notification-queries";
import { useAuthStore } from "@/stores/auth-store";

type NotificationFilter = "all" | "unread" | "read";

export function NotificationsPage() {
  const user = useAuthStore((s) => s.user);
  const [filter, setFilter] = useState<NotificationFilter>("all");
  const notificationsQuery = useNotificationsQuery(user?.id);
  const markReadMutation = useMarkNotificationReadMutation(user?.id ?? 0);

  const filtered = useMemo(() => {
    if (filter === "unread") {
      return notificationsQuery.notifications.filter((item) => !item.read);
    }
    if (filter === "read") {
      return notificationsQuery.notifications.filter((item) => item.read);
    }
    return notificationsQuery.notifications;
  }, [filter, notificationsQuery.notifications]);

  return (
    <PageTransition>
      <PageHeader
        title="Notifications"
        description="Track application and workspace updates."
      />

      <div className="flex flex-wrap gap-2 rounded-lg border border-border bg-card p-2 shadow-sm">
        {(["all", "unread", "read"] as const).map((item) => (
          <button
            key={item}
            type="button"
            onClick={() => setFilter(item)}
            className={
              filter === item
                ? "rounded-md bg-primary px-4 py-2 text-sm font-medium capitalize text-primary-foreground"
                : "rounded-md px-4 py-2 text-sm font-medium capitalize text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
            }
          >
            {item}
          </button>
        ))}
      </div>

      {notificationsQuery.isLoading ? (
        <LoadingSkeleton variant="detail" />
      ) : notificationsQuery.error ? (
        <RetryState
          error={notificationsQuery.error}
          onRetry={notificationsQuery.refetch}
        />
      ) : filtered.length === 0 ? (
        <EmptyState
          icon={Bell}
          title="No notifications"
          description="There are no notifications for this filter."
        />
      ) : (
        <div className="grid gap-3">
          {filtered.map((notification) => (
            <NotificationItem
              key={notification.id}
              notification={notification}
              marking={markReadMutation.isPending}
              onMarkRead={(item) => markReadMutation.mutate(item)}
            />
          ))}
        </div>
      )}
    </PageTransition>
  );
}
