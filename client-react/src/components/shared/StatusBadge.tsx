import { cn } from "@/lib/utils";

const toneClass = {
  neutral: "bg-muted text-muted-foreground",
  success: "bg-success/10 text-success",
  warning: "bg-warning/10 text-warning",
  primary: "bg-primary/10 text-primary",
  destructive: "bg-destructive/10 text-destructive",
};

export function StatusBadge({
  children,
  tone = "neutral",
}: {
  children: string;
  tone?: keyof typeof toneClass;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-md px-2 py-1 text-xs font-medium",
        toneClass[tone],
      )}
    >
      {children}
    </span>
  );
}
