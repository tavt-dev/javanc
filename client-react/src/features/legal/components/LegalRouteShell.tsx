import { AppShell } from "@/components/layout/AppShell";
import { useAuthStore } from "@/stores/auth-store";
import { PublicLegalShell } from "./PublicLegalShell";

export function LegalRouteShell() {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const hasHydrated = useAuthStore((state) => state.hasHydrated);

  if (!hasHydrated) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background text-sm text-muted-foreground">
        Loading session...
      </div>
    );
  }

  return isAuthenticated ? <AppShell /> : <PublicLegalShell />;
}
