"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/features/auth/auth-provider";
import { LoadingState } from "@/components/data-state";
import { useLanguage } from "@/lib/i18n";

export function Protected({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const { authReady, signedIn, token } = useAuth();
  const { t } = useLanguage();

  useEffect(() => {
    if (authReady && !token) {
      router.replace("/login");
    }
  }, [authReady, router, token]);

  if (!authReady || !signedIn) {
    return <LoadingState label={t("state.checkingSession")} />;
  }

  return <>{children}</>;
}
