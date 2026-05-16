import { beforeEach, describe, expect, it, vi } from "vitest";
import apiClient from "@/lib/api-client";
import { authApi } from "./auth-api";

vi.mock("@/lib/api-client", () => ({
  default: {
    post: vi.fn(),
  },
}));

const mockedApiClient = vi.mocked(apiClient);

describe("authApi", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("posts google id tokens to the google login endpoint", async () => {
    mockedApiClient.post.mockResolvedValueOnce({
      data: { success: true, message: "Login successfully", data: {} },
    });

    await authApi.googleLogin({ idToken: "google-id-token" });

    expect(mockedApiClient.post).toHaveBeenCalledWith("/auth/google", {
      idToken: "google-id-token",
    });
  });
});
