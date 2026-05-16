import { useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import {
  prepareGoogleIdentity,
  renderGoogleButton,
} from "@/features/auth/lib/google-identity";
import { GOOGLE_CLIENT_ID } from "@/lib/constants";
import { cn } from "@/lib/utils";

type GoogleSignInState = "loading" | "ready" | "unavailable";
const MAX_BUTTON_WIDTH = 320;
const MIN_BUTTON_WIDTH = 200;

interface GoogleSignInButtonProps {
  onCredential: (credential: string) => void;
  disabled?: boolean;
}

export function GoogleSignInButton({
  onCredential,
  disabled = false,
}: GoogleSignInButtonProps) {
  const { t, i18n } = useTranslation();
  const buttonRef = useRef<HTMLDivElement>(null);
  const onCredentialRef = useRef(onCredential);
  const [state, setState] = useState<GoogleSignInState>("loading");
  const [buttonWidth, setButtonWidth] = useState(MAX_BUTTON_WIDTH);

  useEffect(() => {
    onCredentialRef.current = onCredential;
  }, [onCredential]);

  useEffect(() => {
    const button = buttonRef.current;
    if (!button) return;

    const updateButtonWidth = () => {
      const measuredWidth = button.clientWidth;
      if (!measuredWidth) return;
      setButtonWidth(
        Math.max(MIN_BUTTON_WIDTH, Math.min(MAX_BUTTON_WIDTH, measuredWidth)),
      );
    };

    updateButtonWidth();
    if (typeof ResizeObserver === "undefined") {
      return;
    }

    const observer = new ResizeObserver(updateButtonWidth);
    observer.observe(button);

    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    const button = buttonRef.current;
    if (!GOOGLE_CLIENT_ID || !button) {
      setState("unavailable");
      return;
    }

    let cancelled = false;
    setState("loading");

    void prepareGoogleIdentity(GOOGLE_CLIENT_ID, (credential) =>
      onCredentialRef.current(credential),
    )
      .then(() => {
        if (cancelled || !buttonRef.current) return;

        buttonRef.current.innerHTML = "";
        renderGoogleButton(buttonRef.current, {
          theme: "outline",
          size: "large",
          text: "continue_with",
          shape: "rectangular",
          logo_alignment: "left",
          width: buttonWidth,
          locale: i18n.language,
        });
        setState("ready");
      })
      .catch(() => {
        if (!cancelled) {
          setState("unavailable");
        }
      });

    return () => {
      cancelled = true;
      if (button) {
        button.innerHTML = "";
      }
    };
  }, [buttonWidth, i18n.language]);

  return (
    <div className="space-y-2">
      <div
        ref={buttonRef}
        aria-busy={state === "loading" || disabled}
        aria-label={t("auth.continueWithGoogle")}
        className={cn(
          "flex min-h-11 justify-center",
          disabled && "pointer-events-none opacity-60",
        )}
      />

      {state === "loading" && (
        <p className="text-center text-xs text-muted-foreground">
          {t("auth.googleLoading")}
        </p>
      )}

      {state === "unavailable" && (
        <p className="text-center text-xs text-destructive">
          {t("auth.googleUnavailable")}
        </p>
      )}
    </div>
  );
}
