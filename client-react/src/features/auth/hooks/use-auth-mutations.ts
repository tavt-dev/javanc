import axios from "axios";
import { useMutation } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { queryClient } from "@/lib/query-client";
import { extractErrorMessage } from "@/lib/api-error";
import { useAuthStore } from "@/stores/auth-store";
import { authApi } from "@/features/auth/api/auth-api";
import type {
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
  const navigate = useNavigate();
  const setSession = useAuthStore((s) => s.setSession);

  return useMutation({
    mutationFn: (input: LoginRequest) => authApi.login(input),
    onSuccess: (response) => {
      setSession(response.data);
      toast.success("Signed in successfully");
      navigate("/dashboard", { replace: true });
    },
    onError: (error, variables) => {
      if (isVerificationRequired(error)) {
        toast.message("Verify your email to continue");
        navigate(authPath(variables.email), { replace: true });
      }
    },
  });
}

export function useRegisterMutation() {
  const navigate = useNavigate();

  return useMutation({
    mutationFn: (input: RegisterRequest) => authApi.register(input),
    onSuccess: (response) => {
      toast.success("Verification code sent");
      navigate(authPath(response.data.email, response.data.expiresInSeconds), {
        replace: true,
      });
    },
  });
}

export function useVerifyEmailMutation() {
  const navigate = useNavigate();
  const setSession = useAuthStore((s) => s.setSession);

  return useMutation({
    mutationFn: (input: VerifyEmailRequest) => authApi.verifyEmail(input),
    onSuccess: (response) => {
      setSession(response.data);
      toast.success("Email verified");
      navigate("/dashboard", { replace: true });
    },
  });
}

export function useResendVerificationOtpMutation() {
  return useMutation({
    mutationFn: (input: ResendVerificationOtpRequest) =>
      authApi.resendVerificationOtp(input),
    onSuccess: () => {
      toast.success("A new code was sent");
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
