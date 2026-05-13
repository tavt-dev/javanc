import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter, Route, Routes, useLocation } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { UserDashboardPage } from "@/features/dashboard/pages/UserDashboardPage";
import { useCompaniesQuery } from "@/features/companies/hooks/use-company-queries";
import {
  useAcceptedJobsQuery,
  useJobBoardQuery,
  usePendingJobsQuery,
} from "@/features/jobs/hooks/use-job-queries";
import { useMyProfileQuery } from "@/features/profiles/hooks/use-profile-queries";
import { useMyProjectsQuery } from "@/features/projects/hooks/use-project-queries";

vi.mock("@/stores/auth-store", () => ({
  useAuthStore: (selector: (state: { user: { id: number; name: string; role: string } }) => unknown) =>
    selector({ user: { id: 1, name: "Tien", role: "user" } }),
}));

vi.mock("@/features/profiles/hooks/use-profile-queries", () => ({
  isProfileMissingError: vi.fn(() => false),
  useMyProfileQuery: vi.fn(),
}));

vi.mock("@/features/projects/hooks/use-project-queries", () => ({
  useMyProjectsQuery: vi.fn(),
}));

vi.mock("@/features/jobs/hooks/use-job-queries", () => ({
  useAcceptedJobsQuery: vi.fn(),
  useJobBoardQuery: vi.fn(),
  usePendingJobsQuery: vi.fn(),
}));

vi.mock("@/features/companies/hooks/use-company-queries", () => ({
  useCompaniesQuery: vi.fn(),
}));

const profile = {
  id: 7,
  idUser: 1,
  title: "Java Developer",
  typeProfile: "JAVA",
  objective: "Build reliable products",
  skills: "Java, Spring",
  contact: { email: "tien@example.com" },
};

const jobs = [
  {
    id: 1,
    title: "Senior Java Developer",
    description: "Build Spring services",
    typeJob: "java",
    size: 3,
    idCompany: 10,
  },
  {
    id: 2,
    title: "Python Analyst",
    description: "Analyze data",
    typeJob: "python",
    size: 2,
    idCompany: 11,
  },
];

const companies = [
  { id: 10, name: "JavaNC Labs", type: "Software", idJobs: [1] },
  { id: 11, name: "Data House", type: "Analytics", idJobs: [2] },
];

describe("UserDashboardPage", () => {
  beforeEach(() => {
    vi.mocked(useMyProfileQuery).mockReturnValue({
      profile,
      isLoading: false,
      error: null,
      refetch: vi.fn(),
    } as never);
    vi.mocked(useMyProjectsQuery).mockReturnValue({
      data: [{ id: 1, title: "Booking API", display: true, idProfile: 7 }],
    } as never);
    vi.mocked(useJobBoardQuery).mockReturnValue({
      data: jobs,
      isLoading: false,
      isFetching: false,
      error: null,
      refetch: vi.fn(),
    } as never);
    vi.mocked(useCompaniesQuery).mockReturnValue({
      data: companies,
      isLoading: false,
      isFetching: false,
    } as never);
    vi.mocked(usePendingJobsQuery).mockReturnValue({ data: [jobs[0]] } as never);
    vi.mocked(useAcceptedJobsQuery).mockReturnValue({ data: [] } as never);
  });

  it("renders curated article content", () => {
    renderDashboard();

    expect(screen.getByText("Articles for your next move")).toBeInTheDocument();
    expect(screen.getByText("How to make your Java profile recruiter-ready")).toBeInTheDocument();
    expect(screen.getByText("Recommended jobs")).toBeInTheDocument();
    expect(screen.getByText("Featured companies")).toBeInTheDocument();
  });

  it("submits dashboard search to the job board query params", async () => {
    const user = userEvent.setup();
    renderDashboard();

    await user.type(screen.getByLabelText("Search jobs"), "java");
    await user.selectOptions(screen.getByLabelText("Job type"), "java");
    await user.selectOptions(screen.getByLabelText("Company"), "10");
    await user.click(screen.getByRole("button", { name: /search jobs/i }));

    expect(screen.getByTestId("location")).toHaveTextContent(
      "/jobs?q=java&type=java&companyId=10&openOnly=true",
    );
  });
});

function renderDashboard() {
  return render(
    <MemoryRouter initialEntries={["/user/dashboard"]}>
      <Routes>
        <Route path="/user/dashboard" element={<UserDashboardPage />} />
        <Route path="/jobs" element={<LocationProbe />} />
      </Routes>
    </MemoryRouter>,
  );
}

function LocationProbe() {
  const location = useLocation();
  return <div data-testid="location">{`${location.pathname}${location.search}`}</div>;
}
