import { create } from "zustand";

type Theme = "light" | "dark" | "system";
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

let currentTheme: Theme = (localStorage.getItem(THEME_KEY) as Theme) || "system";
const systemThemeMedia = window.matchMedia("(prefers-color-scheme: dark)");

function applyThemeToDocument(theme: Theme) {
  const root = document.documentElement;
  if (theme === "dark") {
    root.classList.add("dark");
  } else if (theme === "light") {
    root.classList.remove("dark");
  } else {
    root.classList.toggle("dark", systemThemeMedia.matches);
  }
}

applyThemeToDocument(currentTheme);

systemThemeMedia.addEventListener("change", () => {
  if (currentTheme === "system") {
    applyThemeToDocument("system");
  }
});

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
