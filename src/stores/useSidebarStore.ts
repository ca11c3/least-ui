import { create } from "zustand";
import { persist } from "zustand/middleware";

type ThemeMode = "light" | "dark";

type SidebarState = {
  sidebarCollapsed: boolean;
  openMobile: boolean;
  searchTerm: string;
  theme: ThemeMode;
  toggleSidebar: () => void;
  toggleMobileSidebar: () => void;
  setSidebarCollapsed: (sidebarCollapsed: boolean) => void;
  setOpenMobile: (openMobile: boolean) => void;
  setSearchTerm: (searchTerm: string) => void;
  setTheme: (theme: ThemeMode) => void;
  toggleTheme: () => void;
};

// Persist the theme to a cookie so the server can read it during SSR
const THEME_COOKIE = "theme";
const THEME_COOKIE_EXPIRY = 60 * 60 * 24 * 365; // 1 year

const writeThemeCookie = (theme: ThemeMode): void => {
  if (typeof document === "undefined") return;
  document.cookie = `${THEME_COOKIE}=${theme}; path=/; max-age=${THEME_COOKIE_EXPIRY}; SameSite=Lax`;
};

const useSidebarStore = create<SidebarState>()(
  persist(
    (set) => ({
      sidebarCollapsed: false,
      openMobile: false,
      searchTerm: "",
      theme: "light",
      toggleSidebar: () => {
        set((state) => ({ sidebarCollapsed: !state.sidebarCollapsed }));
      },
      toggleMobileSidebar: () => {
        set((state) => ({ openMobile: !state.openMobile }));
      },
      setSidebarCollapsed: (sidebarCollapsed) => {
        set({ sidebarCollapsed });
      },
      setOpenMobile: (openMobile) => {
        set({ openMobile });
      },
      setSearchTerm: (searchTerm) => {
        set({ searchTerm });
      },
      setTheme: (theme) => {
        set({ theme });
        document.documentElement.classList.toggle("dark", theme === "dark");
        writeThemeCookie(theme);
      },
      toggleTheme: () => {
        set((state) => {
          const next = state.theme === "dark" ? "light" : "dark";
          document.documentElement.classList.toggle("dark", next === "dark");
          writeThemeCookie(next);
          return { theme: next };
        });
      },
    }),
    {
      name: "theme",
      partialize: (state) => ({ theme: state.theme }),
      onRehydrateStorage: () => (state) => {
        if (state?.theme) {
          document.documentElement.classList.toggle(
            "dark",
            state.theme === "dark",
          );
          return;
        }
        const prefersDark =
          typeof window !== "undefined" &&
          window.matchMedia("(prefers-color-scheme: dark)").matches;
        const systemTheme: ThemeMode = prefersDark ? "dark" : "light";
        document.documentElement.classList.toggle("dark", prefersDark);
        writeThemeCookie(systemTheme);
        useSidebarStore.setState({ theme: systemTheme });
      },
    },
  ),
);

export default useSidebarStore;
