import { Code2 } from "lucide-react";
import { useTranslation } from "react-i18next";
import { Link, Outlet } from "react-router-dom";

const legalLinks = [
  { key: "footer.about", path: "/about" },
  { key: "footer.privacy", path: "/privacy" },
  { key: "footer.terms", path: "/terms" },
] as const;

export function PublicLegalShell() {
  const { t } = useTranslation();

  return (
    <div className="flex min-h-screen flex-col bg-background [background-image:linear-gradient(to_bottom,hsl(var(--brand-mint)/0.28),transparent_320px)]">
      <header className="border-b border-border/70 bg-card/82 px-4 py-4 backdrop-blur sm:px-6">
        <div className="mx-auto flex w-full max-w-5xl flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <Link
            to="/login"
            className="focus-ring inline-flex items-center gap-2 rounded-md"
            aria-label="JavaNC"
          >
            <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary text-sm font-bold text-primary-foreground shadow-sm ring-1 ring-primary/20">
              J
            </span>
            <span className="font-display text-base font-semibold tracking-tight text-foreground">
              JavaNC
            </span>
          </Link>

          <nav
            aria-label={t("legal.navigation")}
            className="flex flex-wrap items-center gap-x-4 gap-y-2 text-sm"
          >
            {legalLinks.map((link) => (
              <Link
                key={link.path}
                to={link.path}
                className="footer-link focus-ring"
              >
                {t(link.key)}
              </Link>
            ))}
            <Link to="/login" className="footer-link focus-ring">
              {t("legal.backToSignIn")}
            </Link>
          </nav>
        </div>
      </header>

      <main className="flex-1 px-4 py-8 sm:px-6">
        <Outlet />
      </main>

      <footer className="border-t border-border px-4 py-4 text-sm text-muted-foreground sm:px-6">
        <div className="mx-auto flex w-full max-w-5xl items-center gap-2">
          <Code2 size={15} className="text-primary" />
          <span>{t("footer.tagline")}</span>
        </div>
      </footer>
    </div>
  );
}
