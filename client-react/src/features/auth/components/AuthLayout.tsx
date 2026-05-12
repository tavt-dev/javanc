import { motion, useReducedMotion } from "framer-motion";
import type { ReactNode } from "react";

interface AuthLayoutProps {
  title: string;
  subtitle: string;
  children: ReactNode;
}

export function AuthLayout({ title, subtitle, children }: AuthLayoutProps) {
  const reducedMotion = useReducedMotion();
  const transition = reducedMotion
    ? { duration: 0 }
    : { duration: 0.22, ease: [0.2, 0, 0, 1] as const };

  return (
    <main className="min-h-screen bg-background text-foreground lg:grid lg:grid-cols-[minmax(0,1fr)_minmax(420px,520px)]">
      <section className="relative hidden overflow-hidden bg-[#101828] text-white lg:flex lg:flex-col lg:justify-between">
        <div className="absolute inset-0 opacity-20 [background-image:linear-gradient(#ffffff_1px,transparent_1px),linear-gradient(90deg,#ffffff_1px,transparent_1px)] [background-size:44px_44px]" />
        <div className="absolute right-12 top-16 h-28 w-44 rotate-6 rounded-md border border-white/15 bg-white/[0.08]" />
        <div className="absolute bottom-28 left-14 h-36 w-56 -rotate-3 rounded-md border border-white/15 bg-white/[0.08]" />

        <div className="relative z-10 p-10">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary">
              <span className="text-sm font-bold text-primary-foreground">
                J
              </span>
            </div>
            <span className="text-base font-semibold">JavaNC Workspace</span>
          </div>
        </div>

        <div className="relative z-10 max-w-xl p-10">
          <motion.div
            initial={reducedMotion ? false : { opacity: 0, y: 10 }}
            animate={reducedMotion ? undefined : { opacity: 1, y: 0 }}
            transition={transition}
            className="space-y-7"
          >
            <div className="space-y-3">
              <p className="text-sm font-medium text-primary-foreground/80">
                Secure hiring workspace
              </p>
              <h1 className="max-w-lg text-4xl font-semibold leading-tight">
                Manage profiles, jobs, teams, and applications from one focused
                console.
              </h1>
            </div>
            <div className="grid max-w-lg grid-cols-2 gap-3">
              {[
                ["24", "active roles"],
                ["128", "profiles reviewed"],
                ["4", "workspace roles"],
                ["99%", "session coverage"],
              ].map(([value, label]) => (
                <div
                  key={label}
                  className="rounded-lg border border-white/15 bg-white/10 p-4 shadow-sm backdrop-blur"
                >
                  <p className="text-2xl font-semibold">{value}</p>
                  <p className="mt-1 text-sm text-white/70">{label}</p>
                </div>
              ))}
            </div>
          </motion.div>
        </div>
      </section>

      <section className="flex min-h-screen items-center justify-center px-4 py-8 sm:px-6 lg:min-h-0">
        <motion.div
          initial={reducedMotion ? false : { opacity: 0, y: 10 }}
          animate={reducedMotion ? undefined : { opacity: 1, y: 0 }}
          transition={transition}
          className="w-full max-w-[420px]"
        >
          <div className="mb-8 flex items-center justify-center gap-3 lg:hidden">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary">
              <span className="text-sm font-bold text-primary-foreground">
                J
              </span>
            </div>
            <span className="font-semibold">JavaNC Workspace</span>
          </div>

          <div className="rounded-lg border border-border bg-card p-6 shadow-sm sm:p-7">
            <div className="mb-6 space-y-1 text-center">
              <h1 className="text-2xl font-semibold tracking-normal">
                {title}
              </h1>
              <p className="text-sm text-muted-foreground">{subtitle}</p>
            </div>
            {children}
          </div>
        </motion.div>
      </section>
    </main>
  );
}
