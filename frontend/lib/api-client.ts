import { clearAuth, getToken } from "@/lib/storage";
import type { ApiResponse } from "@/lib/types";

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL?.replace(/\/$/, "") ?? "http://localhost:8080";

type RequestOptions = RequestInit & {
  auth?: boolean;
  unwrap?: boolean;
};

export class ApiError extends Error {
  status?: number;

  constructor(message: string, status?: number) {
    super(message);
    this.name = "ApiError";
    this.status = status;
  }
}

function resolveUrl(path: string) {
  if (path.startsWith("http")) {
    return path;
  }

  return `${API_BASE_URL}${path.startsWith("/") ? path : `/${path}`}`;
}

async function parseBody(response: Response) {
  const contentType = response.headers.get("content-type") ?? "";
  if (contentType.includes("application/json")) {
    return response.json();
  }

  const text = await response.text();
  return text ? { success: response.ok, message: text, data: text } : null;
}

export async function apiRequest<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const headers = new Headers(options.headers);

  if (options.auth !== false) {
    const token = getToken();
    if (token) {
      headers.set("Authorization", `Bearer ${token}`);
    }
  }

  const response = await fetch(resolveUrl(path), {
    ...options,
    headers,
    cache: "no-store"
  });

  const payload = await parseBody(response);

  if (response.status === 401) {
    if (options.auth !== false) {
      clearAuth();
      if (typeof window !== "undefined") {
        window.location.assign("/login");
      }
    }
    throw new ApiError(payload?.message ?? "Unauthorized", 401);
  }

  if (!response.ok) {
    throw new ApiError(payload?.message ?? `Request failed with ${response.status}`, response.status);
  }

  if (options.unwrap === false) {
    return payload as T;
  }

  if (payload && typeof payload === "object" && "success" in payload) {
    const wrapped = payload as ApiResponse<T>;
    if (!wrapped.success) {
      throw new ApiError(wrapped.message || "Request failed", response.status);
    }
    return wrapped.data;
  }

  return payload as T;
}

export function jsonBody(value: unknown): RequestInit {
  return {
    body: JSON.stringify(value),
    headers: {
      "Content-Type": "application/json"
    }
  };
}
