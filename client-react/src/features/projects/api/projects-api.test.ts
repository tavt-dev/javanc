import { beforeEach, describe, expect, it, vi } from "vitest";
import apiClient from "@/lib/api-client";
import { projectsApi } from "./projects-api";

vi.mock("@/lib/api-client", () => ({
  default: {
    delete: vi.fn(),
    get: vi.fn(),
    patch: vi.fn(),
    post: vi.fn(),
  },
}));

const mockedApiClient = vi.mocked(apiClient);

describe("projectsApi", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("gets projects by profile using id query param", async () => {
    mockedApiClient.get.mockResolvedValue({ data: { data: [] } });

    await projectsApi.profilesCompatibility();
    await projectsApi.getByProfile(42);
    await projectsApi.imageCompatibilityStatus();

    expect(mockedApiClient.get).toHaveBeenNthCalledWith(
      1,
      "/project/user/getProfile",
      { params: { page: 0, size: 20, sort: "createdAt,desc" } },
    );
    expect(mockedApiClient.get).toHaveBeenNthCalledWith(
      2,
      "/project/user/getProject",
      { params: { id: 42, page: 0, size: 20, sort: "createAt,desc" } },
    );
    expect(mockedApiClient.get).toHaveBeenNthCalledWith(
      3,
      "/project/user/get1",
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

  it("uses RESTful current-user project endpoints", async () => {
    mockedApiClient.get.mockResolvedValue({ data: { data: [] } });
    mockedApiClient.post.mockResolvedValue({ data: { data: {} } });
    mockedApiClient.patch.mockResolvedValue({ data: { data: {} } });
    mockedApiClient.delete.mockResolvedValue({ data: { data: null } });

    await projectsApi.myProjects();
    await projectsApi.myProject(4);
    await projectsApi.createMyProject({
      title: "New",
      description: "Demo",
      display: true,
    });
    await projectsApi.updateMyProject(4, {
      title: "Updated",
      description: "Demo",
      display: false,
    });
    await projectsApi.deleteMyProject(4);

    expect(mockedApiClient.get).toHaveBeenNthCalledWith(
      1,
      "/project/user/projects",
      { params: { page: 0, size: 20, sort: "createAt,desc" } },
    );
    expect(mockedApiClient.get).toHaveBeenNthCalledWith(
      2,
      "/project/user/projects/4",
    );
    expect(mockedApiClient.post).toHaveBeenCalledWith("/project/user/projects", {
      title: "New",
      description: "Demo",
      display: true,
    });
    expect(mockedApiClient.patch).toHaveBeenCalledWith(
      "/project/user/projects/4",
      {
        title: "Updated",
        description: "Demo",
        display: false,
      },
    );
    expect(mockedApiClient.delete).toHaveBeenCalledWith(
      "/project/user/projects/4",
    );
  });
});
