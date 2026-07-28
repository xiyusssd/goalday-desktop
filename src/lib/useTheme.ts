import { useEffect } from "react";
import { useStore } from "../store";

/**
 * Applies the user's theme preference to <html>. For "system" it follows
 * prefers-color-scheme and reacts to OS changes live.
 */
export function useTheme(): void {
  const theme = useStore((s) => s.settings.theme);
  const palette = useStore((s) => s.settings.palette);

  useEffect(() => {
    const root = document.documentElement;
    const media = window.matchMedia("(prefers-color-scheme: dark)");

    const apply = () => {
      const dark = theme === "dark" || (theme === "system" && media.matches);
      root.classList.toggle("dark", dark);
    };

    apply();
    if (theme === "system") {
      media.addEventListener("change", apply);
      return () => media.removeEventListener("change", apply);
    }
  }, [theme]);

  useEffect(() => {
    document.documentElement.dataset.palette = palette;
  }, [palette]);
}
