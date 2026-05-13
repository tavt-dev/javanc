import { Navigate } from "react-router-dom";
import { useAuthStore } from "@/stores/auth-store";
import { getDashboardPath } from "./dashboard-path";

export function GuestRoute({ children }: { children: React.ReactNode }) {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const hasHydrated = useAuthStore((s) => s.hasHydrated);
  const role = useAuthStore((s) => s.user?.role);

  if (!hasHydrated) {
    return <RouteSplash />;
  }

  if (isAuthenticated) {
    return <Navigate to={getDashboardPath(role)} replace />;
  }

  return <>{children}</>;
}

function RouteSplash() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background text-sm text-muted-foreground">
      Loading session...
    </div>
  );
}
