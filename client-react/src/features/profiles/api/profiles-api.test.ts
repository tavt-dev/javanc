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
        sort: "createdAt,desc",
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

  it("serializes batch ids for JAX-RS list query params", async () => {
    mockedApiClient.get.mockResolvedValueOnce({ data: { data: [] } });

    await profilesApi.batch([1, 2]);

    const config = mockedApiClient.get.mock.calls[0]?.[1];
    const serializer = config?.paramsSerializer as
      | { serialize?: (params: Record<string, unknown>) => string }
      | undefined;

    expect(mockedApiClient.get).toHaveBeenCalledWith("/profiles/batch", {
      params: { ids: [1, 2] },
      paramsSerializer: expect.any(Object),
    });
    expect(serializer?.serialize?.({ ids: [1, 2] })).toBe("ids=1&ids=2");
  });
});
