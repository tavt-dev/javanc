import { act, fireEvent, render, screen } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { useCompaniesQuery } from "@/features/companies/hooks/use-company-queries";
import { CompaniesPage } from "./CompaniesPage";

vi.mock("@/features/companies/hooks/use-company-queries", () => ({
  useCompaniesQuery: vi.fn(),
}));

describe("CompaniesPage", () => {
  beforeEach(() => {
    vi.mocked(useCompaniesQuery).mockReturnValue(mockHookReturn<ReturnType<typeof useCompaniesQuery>>({
      data: page([{ id: 1, name: "JavaNC Labs", type: "Software" }]),
      isLoading: false,
      error: null,
      refetch: vi.fn(),
    }));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("debounces company searches while typing", () => {
    vi.useFakeTimers();
    renderCompanies();

    fireEvent.change(
      screen.getByLabelText("Search companies, industries, or hiring teams"),
      { target: { value: "javanc" } },
    );

    expect(useCompaniesQuery).not.toHaveBeenLastCalledWith(
      expect.objectContaining({ query: "javanc" }),
    );

    act(() => {
      vi.advanceTimersByTime(300);
    });

    expect(useCompaniesQuery).toHaveBeenLastCalledWith(
      expect.objectContaining({ query: "javanc" }),
    );
  });
});

function renderCompanies() {
  return render(
    <MemoryRouter initialEntries={["/companies"]}>
      <Routes>
        <Route path="/companies" element={<CompaniesPage />} />
      </Routes>
    </MemoryRouter>,
  );
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

function mockHookReturn<T>(value: unknown): T {
  return value as T;
}
