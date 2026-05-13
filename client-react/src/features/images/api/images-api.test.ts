import { beforeEach, describe, expect, it, vi } from "vitest";
import apiClient from "@/lib/api-client";
import { imagesApi } from "./images-api";

vi.mock("@/lib/api-client", () => ({
  default: {
    get: vi.fn(),
    post: vi.fn(),
  },
}));

vi.mock("@/lib/constants", () => ({
  API_BASE_URL: "http://localhost:8080",
}));

const mockedApiClient = vi.mocked(apiClient);

describe("imagesApi", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("uploads using multipart image field", async () => {
    mockedApiClient.post.mockResolvedValueOnce({ data: { data: {} } });
    const file = new File(["avatar"], "avatar.png", { type: "image/png" });

    await imagesApi.upload(file);

    const formData = mockedApiClient.post.mock.calls[0]?.[1] as FormData;
    expect(mockedApiClient.post).toHaveBeenCalledWith(
      "/image/save",
      expect.any(FormData),
      { headers: { "Content-Type": "multipart/form-data" } },
    );
    expect(formData.get("image")).toBe(file);
  });

  it("requests a low-resolution preview", async () => {
    mockedApiClient.get.mockResolvedValueOnce({ data: { data: "preview" } });

    await imagesApi.preview("https://cdn.example.com/image.png", 240);

    expect(mockedApiClient.get).toHaveBeenCalledWith("/image/preview", {
      params: { url: "https://cdn.example.com/image.png", width: 240 },
    });
  });

  it("checks image service health and builds local file URLs", async () => {
    mockedApiClient.get.mockResolvedValueOnce({ data: { data: "ok" } });

    await imagesApi.healthCheck();

    expect(mockedApiClient.get).toHaveBeenCalledWith("/image/getAll");
    expect(imagesApi.fileUrl("avatar 1.png")).toBe(
      "http://localhost:8080/image/files/avatar%201.png",
    );
  });
});
