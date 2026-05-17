import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { LegalPageLayout } from "./LegalPageLayout";

describe("LegalPageLayout", () => {
  it("renders the title, intro, updated date, and sections", () => {
    render(
      <LegalPageLayout
        title="Privacy"
        intro="Intro text"
        lastUpdated="17/05/2026"
        sections={[
          {
            title: "Data",
            body: ["First paragraph", "Second paragraph"],
          },
        ]}
      />,
    );

    expect(screen.getByRole("heading", { name: "Privacy" })).toBeInTheDocument();
    expect(screen.getByText("Intro text")).toBeInTheDocument();
    expect(screen.getByText(/17\/05\/2026/)).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Data" })).toBeInTheDocument();
    expect(screen.getByText("Second paragraph")).toBeInTheDocument();
  });
});
