import {
  Bell,
  Check,
  LayoutPanelLeft,
  Monitor,
  Moon,
  Send,
  Shield,
  Sun,
  X,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import type { ReactNode } from "react";
import { PageTransition } from "@/components/motion/PageTransition";
import { PageHeader } from "@/components/shared/PageHeader";
import { StatusBadge } from "@/components/shared/StatusBadge";
import {
  useAcceptHrPromotionWithCompanyMutation,
  useLeaveHrCompanyMutation,
} from "@/features/companies/hooks/use-company-queries";
import {
  useMyHrPromotionsQuery,
  useMyRoleRequestsQuery,
  useRejectHrPromotionMutation,
  useRequestManagerUpgradeMutation,
} from "@/features/users/hooks/use-user-queries";
import { useAuthStore } from "@/stores/auth-store";
import { useUIStore } from "@/stores/ui-store";
import { cn, formatDate } from "@/lib/utils";

const themeOptions = [
  { value: "light", label: "Light", icon: Sun },
  { value: "dark", label: "Dark", icon: Moon },
  { value: "system", label: "System", icon: Monitor },
] as const;

export function SettingsPage() {
  const user = useAuthStore((s) => s.user);
  const theme = useUIStore((s) => s.theme);
  const setTheme = useUIStore((s) => s.setTheme);
  const sidebarCollapsed = useUIStore((s) => s.sidebarCollapsed);
  const toggleSidebarCollapsed = useUIStore((s) => s.toggleSidebarCollapsed);
  const roleRequestsQuery = useMyRoleRequestsQuery();
  const hrPromotionsQuery = useMyHrPromotionsQuery();
  const requestManagerMutation = useRequestManagerUpgradeMutation();
  const acceptHrMutation = useAcceptHrPromotionWithCompanyMutation();
  const rejectHrMutation = useRejectHrPromotionMutation();
  const leaveHrMutation = useLeaveHrCompanyMutation();
  const managerRequestPending = (roleRequestsQuery.data ?? []).some(
    (request) =>
      request.type === "MANAGER_UPGRADE" &&
      (request.status === "PENDING_SYSADMIN" ||
        request.status === "PENDING_USER_CONFIRMATION"),
  );
  const pendingHrInvitations = (hrPromotionsQuery.data ?? []).filter(
    (request) => request.status === "PENDING_USER_CONFIRMATION",
  );

  return (
    <PageTransition>
      <PageHeader
        eyebrow="Preferences"
        title="Settings"
        description="Account, appearance, and workspace preferences."
      />

      <div className="grid gap-6 xl:grid-cols-[0.9fr_1.1fr]">
        <section className="surface p-5">
          <div className="flex items-start gap-3">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-primary/10 ring-1 ring-primary/15">
              <Shield size={20} className="text-primary" />
            </div>
            <div className="min-w-0">
              <h2 className="text-lg font-semibold">Account session</h2>
              <p className="mt-1 text-sm text-muted-foreground">
                Current authenticated user restored from the local session.
              </p>
            </div>
          </div>

          <div className="mt-5 space-y-3 text-sm">
            <InfoRow label="Name" value={user?.name || "Unknown"} />
            <InfoRow label="Email" value={user?.email || "Unknown"} />
            <InfoRow
              label="Role"
              value={
                <StatusBadge tone="primary">{user?.role || "user"}</StatusBadge>
              }
            />
            <InfoRow
              label="Status"
              value={
                <StatusBadge tone={user?.active ? "success" : "warning"}>
                  {user?.status || (user?.active ? "ACTIVE" : "UNKNOWN")}
                </StatusBadge>
              }
            />
          </div>
        </section>

        <section className="surface p-5">
          <div className="flex items-start gap-3">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-primary/10 ring-1 ring-primary/15">
              <Monitor size={20} className="text-primary" />
            </div>
            <div>
              <h2 className="text-lg font-semibold">Appearance</h2>
              <p className="mt-1 text-sm text-muted-foreground">
                Theme is persisted locally and applied before the app renders.
              </p>
            </div>
          </div>

          <div className="mt-5 grid gap-3 sm:grid-cols-3">
            {themeOptions.map((option) => {
              const Icon = option.icon;
              const active = theme === option.value;
              return (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => setTheme(option.value)}
                  className={cn(
                    "focus-ring flex items-center justify-between rounded-lg border px-4 py-3 text-sm font-medium transition-colors",
                    active
                      ? "border-primary bg-primary/10 text-primary"
                      : "border-border hover:bg-accent",
                  )}
                >
                  <span className="inline-flex items-center gap-2">
                    <Icon size={16} />
                    {option.label}
                  </span>
                  {active && <span className="text-xs">Active</span>}
                </button>
              );
            })}
          </div>
        </section>
      </div>

      <section className="surface p-5">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <h2 className="text-lg font-semibold">Role requests</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Request manager access and respond to HR invitations.
            </p>
          </div>
          {user?.role === "user" && (
            <button
              type="button"
              disabled={managerRequestPending || requestManagerMutation.isPending}
              onClick={() => requestManagerMutation.mutate({})}
              className="inline-flex items-center justify-center gap-2 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-70"
            >
              <Send size={16} />
              {managerRequestPending ? "Manager request pending" : "Request manager"}
            </button>
          )}
          {user?.role === "hr" && (
            <button
              type="button"
              disabled={leaveHrMutation.isPending}
              onClick={() => leaveHrMutation.mutate()}
              className="inline-flex items-center justify-center gap-2 rounded-md border border-destructive/30 px-4 py-2 text-sm font-medium text-destructive hover:bg-destructive/10 disabled:opacity-70"
            >
              <X size={16} />
              Leave HR role
            </button>
          )}
        </div>

        <div className="mt-4 grid gap-3">
          {pendingHrInvitations.map((request) => (
            <div
              key={request.id}
              className="rounded-lg border border-border bg-background/40 p-4"
            >
              <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                <div>
                  <div className="flex flex-wrap gap-2">
                    <StatusBadge tone="primary">HR_PROMOTION</StatusBadge>
                    <StatusBadge tone="warning">{request.status}</StatusBadge>
                  </div>
                  <p className="mt-2 font-medium">
                    {request.companyName || `Company #${request.companyId}`}
                  </p>
                  <p className="mt-1 text-sm text-muted-foreground">
                    Invited by {request.requesterName || `user #${request.requesterUserId}`}
                  </p>
                </div>
                <div className="flex gap-2">
                  <button
                    type="button"
                    disabled={acceptHrMutation.isPending}
                    onClick={() => acceptHrMutation.mutate(request.id)}
                    className="inline-flex items-center gap-2 rounded-md bg-primary px-3 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-70"
                  >
                    <Check size={15} />
                    Accept
                  </button>
                  <button
                    type="button"
                    disabled={rejectHrMutation.isPending}
                    onClick={() => rejectHrMutation.mutate(request.id)}
                    className="inline-flex items-center gap-2 rounded-md border border-border px-3 py-2 text-sm font-medium hover:bg-accent disabled:opacity-70"
                  >
                    <X size={15} />
                    Reject
                  </button>
                </div>
              </div>
            </div>
          ))}

          {(roleRequestsQuery.data ?? []).slice(0, 5).map((request) => (
            <div
              key={request.id}
              className="flex flex-col gap-2 rounded-md border border-border bg-background/40 px-3 py-3 text-sm sm:flex-row sm:items-center sm:justify-between"
            >
              <div className="min-w-0">
                <p className="font-medium">{request.type}</p>
                <p className="text-xs text-muted-foreground">
                  {formatDate(request.createdAt)}
                  {request.companyName ? ` - ${request.companyName}` : ""}
                </p>
              </div>
              <StatusBadge tone={roleRequestTone(request.status)}>
                {request.status}
              </StatusBadge>
            </div>
          ))}

          {!pendingHrInvitations.length &&
            !(roleRequestsQuery.data ?? []).length && (
              <p className="text-sm text-muted-foreground">
                No role requests or HR invitations yet.
              </p>
            )}
        </div>
      </section>

      <section className="surface p-5">
        <div className="grid gap-4 md:grid-cols-2">
          <PreferenceRow
            icon={LayoutPanelLeft}
            title="Compact desktop sidebar"
            description="Collapse the sidebar labels on large screens for more workspace width."
            enabled={sidebarCollapsed}
            onToggle={toggleSidebarCollapsed}
          />
          <PreferenceRow
            icon={Bell}
            title="Notification polling"
            description="Notifications refresh every 30 seconds while authenticated."
            enabled
            disabled
            onToggle={() => undefined}
          />
        </div>
      </section>
    </PageTransition>
  );
}

function InfoRow({
  label,
  value,
}: {
  label: string;
  value: ReactNode;
}) {
  return (
    <div className="flex items-center justify-between gap-4 rounded-md border border-border bg-background/40 px-3 py-2">
      <span className="text-muted-foreground">{label}</span>
      <span className="min-w-0 truncate text-right font-medium">{value}</span>
    </div>
  );
}

function roleRequestTone(status: string) {
  if (status === "APPROVED") return "success";
  if (status === "REJECTED" || status === "CANCELLED") return "danger";
  return "warning";
}

function PreferenceRow({
  icon: Icon,
  title,
  description,
  enabled,
  disabled = false,
  onToggle,
}: {
  icon: LucideIcon;
  title: string;
  description: string;
  enabled: boolean;
  disabled?: boolean;
  onToggle: () => void;
}) {
  return (
    <div className="flex items-start justify-between gap-4 rounded-lg border border-border bg-background/40 p-4">
      <div className="flex min-w-0 gap-3">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-muted ring-1 ring-border">
          <Icon size={18} className="text-muted-foreground" />
        </div>
        <div>
          <h3 className="font-medium">{title}</h3>
          <p className="mt-1 text-sm text-muted-foreground">{description}</p>
        </div>
      </div>
      <button
        type="button"
        disabled={disabled}
        onClick={onToggle}
        aria-pressed={enabled}
        aria-label={`Toggle ${title}`}
        className={cn(
          "focus-ring relative h-6 w-11 shrink-0 rounded-full transition-colors disabled:cursor-not-allowed disabled:opacity-70",
          enabled ? "bg-primary" : "bg-muted",
        )}
      >
        <span
          className={cn(
            "absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform",
            enabled ? "translate-x-5" : "translate-x-0.5",
          )}
        />
      </button>
    </div>
  );
}
