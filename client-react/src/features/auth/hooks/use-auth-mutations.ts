import axios from "axios";
import { useMutation } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { queryClient } from "@/lib/query-client";
import { extractErrorMessage } from "@/lib/api-error";
import { useAuthStore } from "@/stores/auth-store";
import { authApi } from "@/features/auth/api/auth-api";
import { getDashboardPath } from "@/routes/dashboard-path";
import { useTranslation } from "react-i18next";
import type {
  GoogleLoginRequest,
  LoginRequest,
  RegisterRequest,
  ResendVerificationOtpRequest,
  VerifyEmailRequest,
} from "@/types/auth";

function authPath(email: string, expiresInSeconds?: number) {
  const params = new URLSearchParams({ email });
  if (expiresInSeconds) {
    params.set("expiresInSeconds", String(expiresInSeconds));
  }
  return `/verify-email?${params.toString()}`;
}

function isVerificationRequired(error: unknown) {
  if (!axios.isAxiosError(error)) return false;
  const message = String(error.response?.data?.message ?? "");
  return (
    error.response?.status === 403 &&
    message.toLowerCase().includes("verification")
  );
}

export function useLoginMutation() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const setSession = useAuthStore((s) => s.setSession);

  return useMutation({
    mutationFn: (input: LoginRequest) => authApi.login(input),
    onSuccess: (response) => {
      setSession(response.data);
      toast.success(t("auth.signedIn"));
      navigate(getDashboardPath(response.data.user.role), { replace: true });
    },
    onError: (error, variables) => {
      if (isVerificationRequired(error)) {
        toast.message(t("auth.verificationRequired"));
        navigate(authPath(variables.email), { replace: true });
      }
    },
  });
}

export function useGoogleLoginMutation() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const setSession = useAuthStore((s) => s.setSession);

  return useMutation({
    mutationFn: (input: GoogleLoginRequest) => authApi.googleLogin(input),
    onSuccess: (response) => {
      setSession(response.data);
      toast.success(t("auth.signedIn"));
      navigate(getDashboardPath(response.data.user.role), { replace: true });
    },
  });
}

export function useRegisterMutation() {
  const { t } = useTranslation();
  const navigate = useNavigate();

  return useMutation({
    mutationFn: (input: RegisterRequest) => authApi.register(input),
    onSuccess: (response) => {
      toast.success(t("auth.verificationSent"));
      navigate(authPath(response.data.email, response.data.expiresInSeconds), {
        replace: true,
      });
    },
  });
}

export function useVerifyEmailMutation() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const setSession = useAuthStore((s) => s.setSession);

  return useMutation({
    mutationFn: (input: VerifyEmailRequest) => authApi.verifyEmail(input),
    onSuccess: (response) => {
      setSession(response.data);
      toast.success(t("auth.emailVerified"));
      navigate(getDashboardPath(response.data.user.role), { replace: true });
    },
  });
}

export function useResendVerificationOtpMutation() {
  const { t } = useTranslation();
  return useMutation({
    mutationFn: (input: ResendVerificationOtpRequest) =>
      authApi.resendVerificationOtp(input),
    onSuccess: () => {
      toast.success(t("auth.newCodeSent"));
    },
  });
}

export function useLogoutMutation() {
  const navigate = useNavigate();
  const logoutLocal = useAuthStore((s) => s.logoutLocal);

  return useMutation({
    mutationFn: (accessToken?: string | null) =>
      authApi.logout(accessToken ?? undefined),
    onMutate: () => {
      logoutLocal();
      queryClient.clear();
      navigate("/login", { replace: true });
    },
    onError: (error) => {
      toast.message(extractErrorMessage(error));
    },
  });
}
