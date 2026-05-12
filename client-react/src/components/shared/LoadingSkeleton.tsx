import { cn } from "@/lib/utils";

export function LoadingSkeleton({
  variant = "page",
}: {
  variant?: "page" | "cardGrid" | "form" | "detail";
}) {
  if (variant === "cardGrid") {
    return (
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {Array.from({ length: 6 }).map((_, index) => (
          <SkeletonBlock key={index} className="h-44 rounded-lg" />
        ))}
      </div>
    );
  }

  if (variant === "form") {
    return (
      <div className="space-y-4">
        {Array.from({ length: 6 }).map((_, index) => (
          <div key={index} className="space-y-2">
            <SkeletonBlock className="h-4 w-28 rounded" />
            <SkeletonBlock className="h-11 rounded-md" />
          </div>
        ))}
      </div>
    );
  }

  if (variant === "detail") {
    return (
      <div className="space-y-5">
        <SkeletonBlock className="h-32 rounded-lg" />
        <SkeletonBlock className="h-24 rounded-lg" />
        <SkeletonBlock className="h-24 rounded-lg" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, index) => (
          <SkeletonBlock key={index} className="h-28 rounded-lg" />
        ))}
      </div>
      <SkeletonBlock className="h-64 rounded-lg" />
    </div>
  );
}

export function SkeletonBlock({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        "animate-pulse bg-muted motion-reduce:animate-none",
        className,
      )}
    />
  );
}
