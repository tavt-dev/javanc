import { beforeEach, describe, expect, it, vi } from "vitest";
import apiClient from "@/lib/api-client";
import { profilesApi } from "./profiles-api";

vi.mock("@/lib/api-client", () => ({
  default: {
    get: vi.fn(),
    post: vi.fn(),
    patch: vi.fn(),
    delete: vi.fn(),
  },
}));

const mockedApiClient = vi.mocked(apiClient);

describe("profilesApi", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("sends search params through axios params", async () => {
    mockedApiClient.get.mockResolvedValueOnce({ data: { data: [] } });

    await profilesApi.search({
      type: "JAVA",
      title: "developer",
      page: 0,
      size: 20,
    });

    expect(mockedApiClient.get).toHaveBeenCalledWith("/profiles", {
      params: {
        type: "JAVA",
        title: "developer",
        page: 0,
        size: 20,
      },
    });
  });

  it("uploads avatar with multipart image field", async () => {
    mockedApiClient.post.mockResolvedValueOnce({ data: { data: {} } });
    const file = new File(["avatar"], "avatar.png", { type: "image/png" });

    await profilesApi.updateAvatar(file);

    const call = mockedApiClient.post.mock.calls[0];
    const formData = call?.[1];
    expect(formData).toBeInstanceOf(FormData);
    expect((formData as FormData).get("image")).toBe(file);
  });
});
