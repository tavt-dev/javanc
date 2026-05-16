import apiClient from "@/lib/api-client";
import type { ApiResponse } from "@/types/api";
import type {
  AuthSession,
  GoogleLoginRequest,
  LoginRequest,
  RefreshTokenRequest,
  RegisterRequest,
  RegistrationPending,
  ResendVerificationOtpRequest,
  TokenIntrospection,
  TokenIntrospectionRequest,
  VerifyEmailRequest,
} from "@/types/auth";

export const authApi = {
  async register(input: RegisterRequest) {
    const { data } = await apiClient.post<ApiResponse<RegistrationPending>>(
      "/auth/register",
      input,
    );
    return data;
  },

  async verifyEmail(input: VerifyEmailRequest) {
    const { data } = await apiClient.post<ApiResponse<AuthSession>>(
      "/auth/verify-email",
      input,
    );
    return data;
  },

  async resendVerificationOtp(input: ResendVerificationOtpRequest) {
    const { data } = await apiClient.post<ApiResponse<void>>(
      "/auth/resend-verification-otp",
      input,
    );
    return data;
  },

  async login(input: LoginRequest) {
    const { data } = await apiClient.post<ApiResponse<AuthSession>>(
      "/auth/login",
      input,
    );
    return data;
  },

  async googleLogin(input: GoogleLoginRequest) {
    const { data } = await apiClient.post<ApiResponse<AuthSession>>(
      "/auth/google",
      input,
    );
    return data;
  },

  async refresh(input: RefreshTokenRequest) {
    const { data } = await apiClient.post<ApiResponse<AuthSession>>(
      "/auth/refresh",
      input,
    );
    return data;
  },

  async introspect(input: TokenIntrospectionRequest) {
    const { data } = await apiClient.post<ApiResponse<TokenIntrospection>>(
      "/auth/introspect",
      input,
    );
    return data;
  },

  async logout(accessToken?: string) {
    const { data } = await apiClient.post<ApiResponse<void>>(
      "/auth/logout",
      undefined,
      accessToken
        ? { headers: { Authorization: `Bearer ${accessToken}` } }
        : undefined,
    );
    return data;
  },
};
