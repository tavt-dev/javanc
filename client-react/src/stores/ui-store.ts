import { create } from "zustand";

type Theme = "light" | "dark" | "system";

interface UIState {
  sidebarOpen: boolean;
  sidebarCollapsed: boolean;
  theme: Theme;
  setTheme: (theme: Theme) => void;
  toggleSidebar: () => void;
  toggleSidebarCollapsed: () => void;
  closeSidebar: () => void;
}

function applyThemeToDocument(theme: Theme) {
  const root = document.documentElement;
  if (theme === "dark") {
    root.classList.add("dark");
  } else if (theme === "light") {
    root.classList.remove("dark");
  } else {
    const prefersDark = window.matchMedia(
      "(prefers-color-scheme: dark)",
    ).matches;
    root.classList.toggle("dark", prefersDark);
  }
}

const savedTheme = (localStorage.getItem("theme") as Theme) || "system";
applyThemeToDocument(savedTheme);

export const useUIStore = create<UIState>((set) => ({
  sidebarOpen: false,
  sidebarCollapsed: false,
  theme: savedTheme,

  setTheme: (theme) => {
    localStorage.setItem("theme", theme);
    applyThemeToDocument(theme);
    set({ theme });
  },

  toggleSidebar: () => set((s) => ({ sidebarOpen: !s.sidebarOpen })),
  toggleSidebarCollapsed: () =>
    set((s) => ({ sidebarCollapsed: !s.sidebarCollapsed })),
  closeSidebar: () => set({ sidebarOpen: false }),
}));
