import axios from "axios";
import { describe, expect, it } from "vitest";
import { extractErrorMessage } from "@/lib/api-error";

function axiosError(status: number, message?: string) {
  return new axios.AxiosError("Request failed", undefined, undefined, null, {
    status,
    statusText: "Error",
    headers: {},
    config: { headers: new axios.AxiosHeaders() },
    data: message ? { message } : {},
  });
}

describe("extractErrorMessage", () => {
  it("uses backend ApiResponse message first", () => {
    expect(extractErrorMessage(axiosError(403, "Email verification required"))).toBe(
      "Email verification required",
    );
  });

  it("maps common HTTP statuses", () => {
    expect(extractErrorMessage(axiosError(401))).toBe("Session expired");
    expect(extractErrorMessage(axiosError(403))).toBe(
      "Access denied or account is not active",
    );
    expect(extractErrorMessage(axiosError(409))).toBe(
      "Request conflicts with the current account state",
    );
    expect(extractErrorMessage(axiosError(429))).toBe("Something went wrong");
    expect(extractErrorMessage(axiosError(500))).toBe("Server error");
  });
});
