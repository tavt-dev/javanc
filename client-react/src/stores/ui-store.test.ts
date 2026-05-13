import { beforeEach, describe, expect, it } from "vitest";
import { useUIStore } from "./ui-store";

describe("ui-store", () => {
  beforeEach(() => {
    localStorage.clear();
    document.documentElement.classList.remove("dark");
    useUIStore.setState({
      sidebarOpen: false,
      sidebarCollapsed: false,
      theme: "system",
    });
  });

  it("persists theme changes", () => {
    useUIStore.getState().setTheme("dark");

    expect(localStorage.getItem("theme")).toBe("dark");
    expect(document.documentElement).toHaveClass("dark");
    expect(useUIStore.getState().theme).toBe("dark");
  });

  it("persists collapsed sidebar preference", () => {
    useUIStore.getState().toggleSidebarCollapsed();

    expect(localStorage.getItem("sidebar_collapsed")).toBe("true");
    expect(useUIStore.getState().sidebarCollapsed).toBe(true);
  });
});
