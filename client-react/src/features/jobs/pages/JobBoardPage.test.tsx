import { render, screen } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { useCompaniesQuery } from "@/features/companies/hooks/use-company-queries";
import { JobBoardPage } from "@/features/jobs/pages/JobBoardPage";
import { useJobBoardQuery } from "@/features/jobs/hooks/use-job-queries";
import { useMyProfileQuery } from "@/features/profiles/hooks/use-profile-queries";

vi.mock("@/features/profiles/hooks/use-profile-queries", () => ({
  useMyProfileQuery: vi.fn(),
}));

vi.mock("@/features/jobs/hooks/use-job-queries", () => ({
  useJobBoardQuery: vi.fn(),
}));

vi.mock("@/features/companies/hooks/use-company-queries", () => ({
  useCompaniesQuery: vi.fn(),
}));

const jobs = [
  {
    id: 1,
    title: "Java Developer",
    description: "Build Quarkus services",
    typeJob: "java",
    size: 2,
    idCompany: 1,
  },
  {
    id: 2,
    title: "Python Analyst",
    description: "Analyze hiring data",
    typeJob: "python",
    size: 4,
    idCompany: 2,
  },
  {
    id: 3,
    title: "Python Closed Role",
    description: "Old data job",
    typeJob: "python",
    size: 0,
    idCompany: 2,
  },
];

describe("JobBoardPage", () => {
  beforeEach(() => {
    vi.mocked(useMyProfileQuery).mockReturnValue(mockHookReturn<ReturnType<typeof useMyProfileQuery>>({
      profile: { id: 7 },
    }));
    vi.mocked(useJobBoardQuery).mockReturnValue(mockHookReturn<ReturnType<typeof useJobBoardQuery>>({
      data: jobs,
      isLoading: false,
      error: null,
      refetch: vi.fn(),
    }));
    vi.mocked(useCompaniesQuery).mockReturnValue(mockHookReturn<ReturnType<typeof useCompaniesQuery>>({
      data: [
        { id: 1, name: "JavaNC Labs" },
        { id: 2, name: "Data House" },
      ],
    }));
  });

  it("initializes filters from query params", () => {
    renderJobBoard("/jobs?q=python&type=python&companyId=2&openOnly=true");

    expect(
      screen.getByLabelText("Search jobs, descriptions, or hiring signals"),
    ).toHaveValue("python");
    expect(screen.getByLabelText("Job type")).toHaveValue("python");
    expect(screen.getByLabelText("Company")).toHaveValue("2");
    expect(screen.getByLabelText("Open only")).toBeChecked();
    expect(screen.getByText("Python Analyst")).toBeInTheDocument();
    expect(screen.queryByText("Java Developer")).not.toBeInTheDocument();
    expect(screen.queryByText("Python Closed Role")).not.toBeInTheDocument();
  });
});

function renderJobBoard(initialEntry: string) {
  return render(
    <MemoryRouter initialEntries={[initialEntry]}>
      <Routes>
        <Route path="/jobs" element={<JobBoardPage />} />
      </Routes>
    </MemoryRouter>,
  );
}

function mockHookReturn<T>(value: unknown): T {
  return value as T;
}
