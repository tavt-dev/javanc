import type { ReactNode } from "react";

export function DarkStatsPanel({
  title,
  description,
  children,
}: {
  title?: string;
  description?: string;
  children: ReactNode;
}) {
  return (
    <section className="section-dark p-5 sm:p-6">
      <div className="relative z-10">
        {(title || description) && (
          <div className="mb-5">
            {title && (
              <h2 className="display-title text-xl font-semibold text-white">
                {title}
              </h2>
            )}
            {description && (
              <p className="mt-1 max-w-2xl text-sm text-white/68">
                {description}
              </p>
            )}
          </div>
        )}
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">{children}</div>
      </div>
    </section>
  );
}
