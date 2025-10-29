import { create } from "zustand";

export const DEFAULT_THEME = "light";

export const useThemeStore = create((set) => ({
    theme: localStorage.getItem("chat-theme") || DEFAULT_THEME,
    setTheme: (theme) => {
        localStorage.setItem("chat-theme", theme);
        set({ theme });
    }
}));
