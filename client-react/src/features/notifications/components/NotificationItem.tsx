import { Check, ExternalLink } from "lucide-react";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { formatDate } from "@/lib/utils";
import type { NotificationDTO } from "@/types/notification";

export function NotificationItem({
  notification,
  compact = false,
  marking = false,
  onMarkRead,
}: {
  notification: NotificationDTO;
  compact?: boolean;
  marking?: boolean;
  onMarkRead?: (notification: NotificationDTO) => void;
}) {
  return (
    <article className="rounded-lg border border-border bg-card p-4 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="break-words text-sm font-medium text-foreground">
            {notification.message || "Notification"}
          </p>
          <p className="mt-1 text-xs text-muted-foreground">
            {formatDate(notification.createAt)}
          </p>
        </div>
        <StatusBadge tone={notification.read ? "neutral" : "primary"}>
          {notification.read ? "Read" : "Unread"}
        </StatusBadge>
      </div>

      {!compact && notification.url && (
        <a
          href={notification.url}
          className="mt-3 inline-flex items-center gap-2 text-sm font-medium text-primary hover:underline"
        >
          Open link
          <ExternalLink size={14} />
        </a>
      )}

      {!notification.read && onMarkRead && (
        <button
          type="button"
          onClick={() => onMarkRead(notification)}
          disabled={marking}
          className="mt-3 inline-flex items-center gap-2 rounded-md border border-border px-3 py-2 text-sm font-medium transition-colors hover:bg-accent disabled:cursor-not-allowed disabled:opacity-70"
        >
          <Check size={15} />
          Mark read
        </button>
      )}
    </article>
  );
}
