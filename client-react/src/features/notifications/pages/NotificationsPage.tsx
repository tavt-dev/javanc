import { Bell } from "lucide-react";
import { useSearchParams } from "react-router-dom";
import { PageTransition } from "@/components/motion/PageTransition";
import { EmptyState } from "@/components/shared/EmptyState";
import { LoadingSkeleton } from "@/components/shared/LoadingSkeleton";
import { PageHeader } from "@/components/shared/PageHeader";
import { PaginationControls } from "@/components/shared/PaginationControls";
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
  const [searchParams, setSearchParams] = useSearchParams();
  const filter = readNotificationFilter(searchParams.get("filter"));
  const page = Number(searchParams.get("page") ?? 0);
  const size = Number(searchParams.get("size") ?? 20);
  const sort = searchParams.get("sort") ?? "createAt,desc";
  const notificationsQuery = useNotificationsQuery(user?.id, {
    read: filter === "all" ? undefined : filter === "read",
    page,
    size,
    sort,
  });
  const markReadMutation = useMarkNotificationReadMutation(user?.id ?? 0);
  const notifications = notificationsQuery.notifications;

  const updateListParams = (next: Record<string, string | undefined>) => {
    const updated = new URLSearchParams(searchParams);
    Object.entries(next).forEach(([key, value]) => {
      if (!value) updated.delete(key);
      else updated.set(key, value);
    });
    setSearchParams(updated, { replace: true });
  };

  return (
    <PageTransition>
      <PageHeader
        title="Notifications"
        description="Track application and workspace updates."
      />

      <div className="surface flex flex-wrap gap-2 p-2">
        {(["all", "unread", "read"] as const).map((item) => (
          <button
            key={item}
            type="button"
            onClick={() =>
              updateListParams({
                filter: item === "all" ? undefined : item,
                page: "0",
              })
            }
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
      ) : notifications.length === 0 ? (
        <EmptyState
          icon={Bell}
          title="No notifications"
          description="There are no notifications for this filter."
        />
      ) : (
        <div className="space-y-4">
          <div className="grid gap-3">
            {notifications.map((notification) => (
              <NotificationItem
                key={notification.id}
                notification={notification}
                marking={markReadMutation.isPending}
                onMarkRead={(item) => markReadMutation.mutate(item)}
              />
            ))}
          </div>
          {notificationsQuery.page && (
            <PaginationControls
              page={notificationsQuery.page}
              onPageChange={(nextPage) => updateListParams({ page: String(nextPage) })}
              onSizeChange={(nextSize) =>
                updateListParams({ size: String(nextSize), page: "0" })
              }
            />
          )}
        </div>
      )}
    </PageTransition>
  );
}

function readNotificationFilter(value: string | null): NotificationFilter {
  return value === "unread" || value === "read" ? value : "all";
}
