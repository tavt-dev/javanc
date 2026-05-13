import { create } from "zustand";

type Theme = "light" | "dark";
const THEME_KEY = "theme";
const SIDEBAR_COLLAPSED_KEY = "sidebar_collapsed";

interface UIState {
  sidebarOpen: boolean;
  sidebarCollapsed: boolean;
  theme: Theme;
  setTheme: (theme: Theme) => void;
  toggleSidebar: () => void;
  toggleSidebarCollapsed: () => void;
  closeSidebar: () => void;
}

function readTheme(): Theme {
  return localStorage.getItem(THEME_KEY) === "dark" ? "dark" : "light";
}

let currentTheme: Theme = readTheme();

function applyThemeToDocument(theme: Theme) {
  const root = document.documentElement;
  if (theme === "dark") {
    root.classList.add("dark");
  } else {
    root.classList.remove("dark");
  }
}

applyThemeToDocument(currentTheme);

function readSidebarCollapsed() {
  return localStorage.getItem(SIDEBAR_COLLAPSED_KEY) === "true";
}

export const useUIStore = create<UIState>((set) => ({
  sidebarOpen: false,
  sidebarCollapsed: readSidebarCollapsed(),
  theme: currentTheme,

  setTheme: (theme) => {
    currentTheme = theme;
    localStorage.setItem(THEME_KEY, theme);
    applyThemeToDocument(theme);
    set({ theme });
  },

  toggleSidebar: () => set((s) => ({ sidebarOpen: !s.sidebarOpen })),
  toggleSidebarCollapsed: () =>
    set((s) => {
      const sidebarCollapsed = !s.sidebarCollapsed;
      localStorage.setItem(SIDEBAR_COLLAPSED_KEY, String(sidebarCollapsed));
      return { sidebarCollapsed };
    }),
  closeSidebar: () => set({ sidebarOpen: false }),
}));
