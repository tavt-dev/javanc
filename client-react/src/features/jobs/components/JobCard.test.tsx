import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { describe, expect, it } from "vitest";
import { JobCard } from "./JobCard";

describe("JobCard", () => {
  it("renders pending application state", () => {
    render(
      <MemoryRouter>
        <JobCard
          profileId={7}
          companyName="JavaNC"
          job={{
            id: 1,
            title: "Java Developer",
            typeJob: "java",
            size: 2,
            idCompany: 3,
            idProfiePending: [7],
          }}
        />
      </MemoryRouter>,
    );

    expect(screen.getByText("Java Developer")).toBeInTheDocument();
    expect(screen.getByText("Pending")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /view detail/i })).toHaveAttribute(
      "href",
      "/jobs/1",
    );
  });
});
