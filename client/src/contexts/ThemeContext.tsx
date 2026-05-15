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

interface PresetColors {
  name: string;
  headerFrom: string;
  headerTo: string;
  headerOverlay: string;
  primary: string;
  accent: string;
  ring: string;
  chartPrimary: string;
  chartAccent: string;
}

const COLOR_PRESETS: Record<ColorPreset, PresetColors> = {
  blue: {
    name: "Azul Marinho",
    headerFrom: "#0f172a",
    headerTo: "#1e3a5f",
    headerOverlay: "rgba(15,23,42,0.75)",
    primary: "#0066cc",
    accent: "#00a86b",
    ring: "#0066cc",
    chartPrimary: "#0066cc",
    chartAccent: "#00a86b",
  },
  green: {
    name: "Verde Floresta",
    headerFrom: "#0a2e1a",
    headerTo: "#1a5c35",
    headerOverlay: "rgba(10,46,26,0.80)",
    primary: "#10b981",
    accent: "#34d399",
    ring: "#10b981",
    chartPrimary: "#10b981",
    chartAccent: "#34d399",
  },
  purple: {
    name: "Roxo Real",
    headerFrom: "#1e0a3c",
    headerTo: "#4c1d95",
    headerOverlay: "rgba(30,10,60,0.80)",
    primary: "#a855f7",
    accent: "#c084fc",
    ring: "#a855f7",
    chartPrimary: "#a855f7",
    chartAccent: "#c084fc",
  },
  orange: {
    name: "Laranja Quente",
    headerFrom: "#3d1a00",
    headerTo: "#92400e",
    headerOverlay: "rgba(61,26,0,0.80)",
    primary: "#f97316",
    accent: "#fb923c",
    ring: "#f97316",
    chartPrimary: "#f97316",
    chartAccent: "#fb923c",
  },
};

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

interface ThemeProviderProps {
  children: React.ReactNode;
  defaultTheme?: Theme;
  switchable?: boolean;
}

function applyPreset(preset: ColorPreset) {
  const colors = COLOR_PRESETS[preset];
  const root = document.documentElement;
  root.style.setProperty("--preset-header-from", colors.headerFrom);
  root.style.setProperty("--preset-header-to", colors.headerTo);
  root.style.setProperty("--preset-header-overlay", colors.headerOverlay);
  root.style.setProperty("--primary", colors.primary);
  root.style.setProperty("--ring", colors.ring);
  root.style.setProperty("--chart-1", colors.chartPrimary);
  root.style.setProperty("--chart-2", colors.chartAccent);
  root.style.setProperty("--sidebar-ring", colors.ring);
  root.style.setProperty("--sidebar-accent-foreground", colors.primary);
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

  // Apply preset on mount and whenever it changes
  useEffect(() => {
    applyPreset(colorPreset);
  }, [colorPreset]);

  const toggleTheme = switchable
    ? () => {
        setTheme(prev => (prev === "light" ? "dark" : "light"));
      }
    : undefined;

  const setColorPreset = (preset: ColorPreset) => {
    setColorPresetState(preset);
    localStorage.setItem("colorPreset", preset);
    applyPreset(preset);
  };

  return (
    <ThemeContext.Provider
      value={{ theme, toggleTheme, switchable, colorPreset, setColorPreset }}
    >
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
