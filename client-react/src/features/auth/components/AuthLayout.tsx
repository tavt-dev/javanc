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
      <section className="hero-panel hidden min-h-screen rounded-none border-0 text-white lg:flex lg:flex-col lg:justify-between">
        <div className="absolute inset-0 opacity-[0.18] [background-image:linear-gradient(#ffffff_1px,transparent_1px),linear-gradient(90deg,#ffffff_1px,transparent_1px)] [background-size:44px_44px]" />
        <div className="absolute inset-x-0 top-0 h-48 bg-[linear-gradient(180deg,rgb(16_185_129/0.22),transparent)]" />
        <motion.div
          animate={reducedMotion ? undefined : { y: [0, -4, 0] }}
          transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
          className="absolute right-12 top-20 w-[360px] rounded-lg border border-white/10 bg-white/[0.07] p-4 shadow-2xl backdrop-blur"
        >
          <div className="mb-4 flex items-center justify-between">
            <div>
              <div className="h-2 w-24 rounded-full bg-emerald-100/50" />
              <div className="mt-2 h-2 w-16 rounded-full bg-emerald-100/20" />
            </div>
            <div className="h-8 w-8 rounded-lg bg-emerald-400 shadow-lg shadow-emerald-950/20" />
          </div>
          <div className="mb-3 rounded-full bg-white p-1">
            <div className="h-8 rounded-full bg-emerald-50 px-4 py-2 text-xs font-semibold text-emerald-700">
              Search Java, Python, HR workspace...
            </div>
          </div>
          <div className="space-y-2">
            {[72, 52, 84].map((width, index) => (
              <div
                key={width}
                className="rounded-md border border-white/10 bg-black/10 p-3"
              >
                <div
                  className="h-2 rounded-full bg-emerald-100/45"
                  style={{ width: `${width}%` }}
                />
                <div className="mt-2 flex items-center gap-2">
                  <div className="h-2 w-2/5 rounded-full bg-white/15" />
                  <span className="rounded-full bg-emerald-300/20 px-2 py-0.5 text-[10px] text-emerald-100">
                    {index === 0 ? "Job" : index === 1 ? "Profile" : "Apply"}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </motion.div>
        <div className="absolute bottom-24 left-12 w-[300px] rounded-lg border border-white/10 bg-white/[0.06] p-4 shadow-2xl backdrop-blur">
          <div className="mb-3 flex items-center gap-3">
            <div className="h-9 w-9 rounded-full bg-white/15" />
            <div className="min-w-0 flex-1">
              <div className="h-2 w-28 rounded-full bg-white/30" />
              <div className="mt-2 h-2 w-20 rounded-full bg-white/15" />
            </div>
          </div>
          <div className="grid grid-cols-3 gap-2">
            <div className="h-16 rounded-md bg-white/10" />
            <div className="h-16 rounded-md bg-white/10" />
            <div className="h-16 rounded-md bg-white/10" />
          </div>
        </div>

        <div className="relative z-10 p-10">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary">
              <span className="text-sm font-bold text-primary-foreground">
                J
              </span>
            </div>
            <span className="font-display text-base font-semibold">
              JavaNC Workspace
            </span>
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
              <p className="text-sm font-medium text-emerald-100/80">
                Emerald career console
              </p>
              <h1 className="display-title max-w-lg text-4xl font-semibold leading-tight">
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
                  className="brand-metric p-4 transition-colors hover:bg-white/[0.13]"
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

          <div className="surface p-6 shadow-xl shadow-black/[0.03] sm:p-7">
            <div className="mb-6 space-y-1 text-center">
              <h1 className="display-title text-2xl font-semibold">
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
