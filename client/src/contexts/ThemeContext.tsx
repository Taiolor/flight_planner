import React, { createContext, useContext, useEffect, useState } from "react";

type Theme = "light" | "dark";
type ColorPreset = "blue" | "green" | "purple" | "orange";

interface ThemeContextType {
  theme: Theme;
  toggleTheme?: () => void;
  switchable: boolean;
  colorPreset: ColorPreset;
  setColorPreset: (preset: ColorPreset) => void;
}

const COLOR_PRESETS: Record<ColorPreset, { name: string; primary: string; accent: string }> = {
  blue: { name: "Azul Marinho", primary: "#0f172a", accent: "#3b82f6" },
  green: { name: "Verde Floresta", primary: "#1a3a2a", accent: "#10b981" },
  purple: { name: "Roxo Real", primary: "#2d1b4e", accent: "#a855f7" },
  orange: { name: "Laranja Quente", primary: "#3d2817", accent: "#f97316" },
};

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

interface ThemeProviderProps {
  children: React.ReactNode;
  defaultTheme?: Theme;
  switchable?: boolean;
}

export function ThemeProvider({
  children,
  defaultTheme = "light",
  switchable = true,
}: ThemeProviderProps) {
  const [theme, setTheme] = useState<Theme>(() => {
    if (switchable) {
      const stored = localStorage.getItem("theme");
      return (stored as Theme) || defaultTheme;
    }
    return defaultTheme;
  });

  const [colorPreset, setColorPresetState] = useState<ColorPreset>(() => {
    const stored = localStorage.getItem("colorPreset");
    return (stored as ColorPreset) || "blue";
  });

  useEffect(() => {
    const root = document.documentElement;
    if (theme === "dark") {
      root.classList.add("dark");
    } else {
      root.classList.remove("dark");
    }

    if (switchable) {
      localStorage.setItem("theme", theme);
    }
  }, [theme, switchable]);


  const toggleTheme = switchable
    ? () => {
        setTheme(prev => (prev === "light" ? "dark" : "light"));
      }
    : undefined;

  const setColorPreset = (preset: ColorPreset) => {
    setColorPresetState(preset);
    localStorage.setItem("colorPreset", preset);
    const presetColors = COLOR_PRESETS[preset];
    document.documentElement.style.setProperty("--color-primary", presetColors.primary);
    document.documentElement.style.setProperty("--color-accent", presetColors.accent);
  };

  useEffect(() => {
    const presetColors = COLOR_PRESETS[colorPreset];
    document.documentElement.style.setProperty("--color-primary", presetColors.primary);
    document.documentElement.style.setProperty("--color-accent", presetColors.accent);
  }, [colorPreset]);

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme, switchable, colorPreset, setColorPreset }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error("useTheme must be used within ThemeProvider");
  }
  return context;
}

export { COLOR_PRESETS };
export type { ColorPreset };
