import { beforeEach, describe, expect, it, vi } from "vitest";
import apiClient from "@/lib/api-client";
import { projectsApi } from "./projects-api";

vi.mock("@/lib/api-client", () => ({
  default: {
    get: vi.fn(),
    post: vi.fn(),
  },
}));

const mockedApiClient = vi.mocked(apiClient);

describe("projectsApi", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("gets projects by profile using id query param", async () => {
    mockedApiClient.get.mockResolvedValueOnce({ data: { data: [] } });

    await projectsApi.getByProfile(42);

    expect(mockedApiClient.get).toHaveBeenCalledWith(
      "/project/user/getProject",
      { params: { id: 42 } },
    );
  });

  it("creates projects with idProfile", async () => {
    mockedApiClient.post.mockResolvedValueOnce({ data: { data: {} } });

    await projectsApi.save({
      title: "Portfolio",
      description: "Demo",
      display: true,
      idProfile: 7,
    });

    expect(mockedApiClient.post).toHaveBeenCalledWith("/project/user/save", {
      title: "Portfolio",
      description: "Demo",
      display: true,
      idProfile: 7,
    });
  });
});
