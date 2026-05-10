"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/features/auth/auth-provider";
import { LoadingState } from "@/components/data-state";

export function Protected({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const { signedIn, token } = useAuth();

  useEffect(() => {
    if (!token) {
      router.replace("/login");
    }
  }, [router, token]);

  if (!signedIn) {
    return <LoadingState label="Checking session" />;
  }

  return <>{children}</>;
}
