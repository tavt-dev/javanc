export type Role = "admin" | "user" | "hr" | "manager";

export interface UserDTO {
  id: number;
  name: string;
  email: string;
  idEmployee?: string;
  role: Role;
  status?: string;
  active: boolean;
}

export interface AuthSession {
  accessToken: string;
  refreshToken: string;
  tokenType: string;
  expiresInSeconds: number;
  user: UserDTO;
}

export interface RegistrationPending {
  email: string;
  status: string;
  expiresInSeconds: number;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  name: string;
  email: string;
  password: string;
}

export interface VerifyEmailRequest {
  email: string;
  otp: string;
}

export interface ResendVerificationOtpRequest {
  email: string;
}

export interface RefreshTokenRequest {
  refreshToken: string;
}

export interface TokenIntrospectionRequest {
  token: string;
}

export interface TokenIntrospection {
  active: boolean;
  subject?: string;
  userId?: number;
  role?: Role;
  expiresAt?: number;
}
