import { cn } from "@/lib/utils";

const toneClass = {
  neutral: "bg-muted text-muted-foreground ring-muted-foreground/10",
  success: "bg-success/10 text-success ring-success/20",
  warning: "bg-warning/10 text-warning ring-warning/25",
  primary: "bg-primary/10 text-primary ring-primary/20",
  info: "bg-sky-500/10 text-sky-600 ring-sky-500/20 dark:text-sky-400",
  emerald: "bg-primary/10 text-primary ring-primary/25",
  mint: "bg-[hsl(var(--brand-mint)/0.9)] text-primary ring-primary/15",
  lime: "bg-[hsl(var(--brand-lime)/0.18)] text-[hsl(var(--brand-forest))] ring-[hsl(var(--brand-lime)/0.25)] dark:text-[hsl(var(--brand-lime))]",
  cyan: "bg-[hsl(var(--job-cyan)/0.12)] text-[hsl(var(--job-cyan))] ring-[hsl(var(--job-cyan)/0.22)]",
  navy: "bg-[hsl(var(--hero-dark)/0.08)] text-[hsl(var(--hero-dark))] ring-[hsl(var(--hero-dark)/0.14)] dark:bg-white/10 dark:text-white dark:ring-white/15",
  danger: "bg-destructive/10 text-destructive ring-destructive/20",
  destructive: "bg-destructive/10 text-destructive ring-destructive/20",
};

const sizeClass = {
  sm: "px-2 py-0.5 text-[11px]",
  md: "px-2 py-1 text-xs",
};

export function StatusBadge({
  children,
  tone = "neutral",
  size = "md",
}: {
  children: string;
  tone?: keyof typeof toneClass;
  size?: keyof typeof sizeClass;
}) {
  return (
    <span
      className={cn(
        "inline-flex max-w-full items-center truncate rounded-md font-medium ring-1 ring-inset",
        sizeClass[size],
        toneClass[tone],
      )}
    >
      {children}
    </span>
  );
}
