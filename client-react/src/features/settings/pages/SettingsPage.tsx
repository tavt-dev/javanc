import { Bell, LayoutPanelLeft, Monitor, Moon, Shield, Sun } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import type { ReactNode } from "react";
import { PageTransition } from "@/components/motion/PageTransition";
import { PageHeader } from "@/components/shared/PageHeader";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { useAuthStore } from "@/stores/auth-store";
import { useUIStore } from "@/stores/ui-store";
import { cn } from "@/lib/utils";

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

  return (
    <PageTransition>
      <PageHeader
        title="Settings"
        description="Account, appearance, and workspace preferences."
      />

      <div className="grid gap-6 xl:grid-cols-[0.9fr_1.1fr]">
        <section className="rounded-lg border border-border bg-card p-5 shadow-sm">
          <div className="flex items-start gap-3">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-primary/10">
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

        <section className="rounded-lg border border-border bg-card p-5 shadow-sm">
          <div className="flex items-start gap-3">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-primary/10">
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
                    "flex items-center justify-between rounded-lg border px-4 py-3 text-sm font-medium transition-colors",
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

      <section className="rounded-lg border border-border bg-card p-5 shadow-sm">
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
    <div className="flex items-center justify-between gap-4 rounded-md border border-border px-3 py-2">
      <span className="text-muted-foreground">{label}</span>
      <span className="min-w-0 truncate text-right font-medium">{value}</span>
    </div>
  );
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
    <div className="flex items-start justify-between gap-4 rounded-lg border border-border p-4">
      <div className="flex min-w-0 gap-3">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-muted">
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
          "relative h-6 w-11 shrink-0 rounded-full transition-colors disabled:cursor-not-allowed disabled:opacity-70",
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
