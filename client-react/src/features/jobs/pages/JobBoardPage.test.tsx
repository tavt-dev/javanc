import { act, fireEvent, render, screen } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
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
      data: page(jobs),
      isLoading: false,
      error: null,
      refetch: vi.fn(),
    }));
    vi.mocked(useCompaniesQuery).mockReturnValue(mockHookReturn<ReturnType<typeof useCompaniesQuery>>({
      data: page([
        { id: 1, name: "JavaNC Labs" },
        { id: 2, name: "Data House" },
      ]),
    }));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("initializes filters from query params", () => {
    renderJobBoard("/jobs?q=python&type=python&companyId=2&openOnly=true");

    expect(
      screen.getByLabelText("Search jobs, descriptions, or hiring signals"),
    ).toHaveValue("python");
    expect(screen.getByLabelText("Job type")).toHaveValue("python");
    expect(screen.getByLabelText("Company")).toHaveValue("2");
    expect(screen.getByLabelText("Open only")).toBeChecked();
    expect(useJobBoardQuery).toHaveBeenCalledWith(7, expect.objectContaining({
      query: "python",
      type: "python",
      companyId: "2",
      openOnly: true,
    }));
  });

  it("debounces search requests while typing", () => {
    vi.useFakeTimers();
    renderJobBoard("/jobs");

    fireEvent.change(
      screen.getByLabelText("Search jobs, descriptions, or hiring signals"),
      { target: { value: "java" } },
    );

    expect(useJobBoardQuery).not.toHaveBeenLastCalledWith(
      7,
      expect.objectContaining({ query: "java" }),
    );

    act(() => {
      vi.advanceTimersByTime(300);
    });

    expect(useJobBoardQuery).toHaveBeenLastCalledWith(
      7,
      expect.objectContaining({ query: "java" }),
    );
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

function page<T>(items: T[]) {
  return {
    items,
    page: 0,
    size: 20,
    totalElements: items.length,
    totalPages: items.length ? 1 : 0,
    hasNext: false,
    hasPrevious: false,
  };
}
