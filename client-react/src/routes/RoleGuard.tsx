import type { ReactNode } from "react";
import { ShieldAlert } from "lucide-react";
import { useTranslation } from "react-i18next";
import type { Role } from "@/types/auth";
import { useAuthStore } from "@/stores/auth-store";

interface RoleGuardProps {
  allow: Role[];
  children: ReactNode;
}

export function RoleGuard({ allow, children }: RoleGuardProps) {
  const { t } = useTranslation();
  const user = useAuthStore((s) => s.user);

  if (!user || !allow.includes(user.role)) {
    return (
      <div className="flex min-h-[360px] items-center justify-center">
        <div className="max-w-sm rounded-lg border border-border bg-card p-6 text-center shadow-sm">
          <div className="mx-auto flex h-11 w-11 items-center justify-center rounded-lg bg-destructive/10 text-destructive">
            <ShieldAlert size={22} />
          </div>
          <h1 className="mt-4 text-lg font-semibold">{t("errors.accessDeniedTitle")}</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            {t("errors.accessDeniedDescription")}
          </p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
