import { Navigate } from "react-router-dom";
import { useAuthStore } from "@/stores/auth-store";
import { getDashboardPath } from "./dashboard-path";

export function DashboardRedirect() {
  const role = useAuthStore((s) => s.user?.role);

  return <Navigate to={getDashboardPath(role)} replace />;
}
