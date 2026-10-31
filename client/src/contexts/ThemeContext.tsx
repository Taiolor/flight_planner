import React, { createContext, useContext, useEffect, useState } from "react";

type Theme = "light" | "dark";
type ColorPreset = "blue" | "green" | "purple" | "orange";
type NavyIntensity = "standard" | "intense";

interface ThemeContextType {
  theme: Theme;
  toggleTheme?: () => void;
  switchable: boolean;
  colorPreset: ColorPreset;
  setColorPreset: (preset: ColorPreset) => void;
  navyIntensity: NavyIntensity;
  setNavyIntensity: (intensity: NavyIntensity) => void;
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
    headerFrom: "#071a36",
    headerTo: "#17427e",
    headerOverlay: "rgba(7,26,54,0.80)",
    primary: "#102f61",
    accent: "#00a86b",
    ring: "#17427e",
    chartPrimary: "#17427e",
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

const NAVY_INTENSITIES: Record<NavyIntensity, { name: string; primary: string; ring: string; headerFrom: string; headerTo: string; headerOverlay: string }> = {
  standard: {
    name: "Equilibrado",
    primary: "#102f61",
    ring: "#17427e",
    headerFrom: "#071a36",
    headerTo: "#17427e",
    headerOverlay: "rgba(7,26,54,0.80)",
  },
  intense: {
    name: "Intenso",
    primary: "#071a36",
    ring: "#102f61",
    headerFrom: "#031024",
    headerTo: "#102f61",
    headerOverlay: "rgba(3,16,36,0.88)",
  },
};

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

interface ThemeProviderProps {
  children: React.ReactNode;
  defaultTheme?: Theme;
  switchable?: boolean;
}

function applyPreset(preset: ColorPreset, navyIntensity: NavyIntensity) {
  const colors = preset === "blue" ? { ...COLOR_PRESETS.blue, ...NAVY_INTENSITIES[navyIntensity] } : COLOR_PRESETS[preset];
  const root = document.documentElement;
  root.dataset.navyIntensity = navyIntensity;
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
    return stored && stored in COLOR_PRESETS ? (stored as ColorPreset) : "blue";
  });

  const [navyIntensity, setNavyIntensityState] = useState<NavyIntensity>(() => {
    const stored = localStorage.getItem("smartfly.navy-intensity");
    return stored === "intense" || stored === "standard" ? stored : "standard";
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
    applyPreset(colorPreset, navyIntensity);
  }, [colorPreset, navyIntensity]);

  const toggleTheme = switchable
    ? () => {
        setTheme(prev => (prev === "light" ? "dark" : "light"));
      }
    : undefined;

  const setColorPreset = (preset: ColorPreset) => {
    setColorPresetState(preset);
    localStorage.setItem("colorPreset", preset);
  };

  const setNavyIntensity = (intensity: NavyIntensity) => {
    setNavyIntensityState(intensity);
    localStorage.setItem("smartfly.navy-intensity", intensity);
  };

  return (
    <ThemeContext.Provider
      value={{ theme, toggleTheme, switchable, colorPreset, setColorPreset, navyIntensity, setNavyIntensity }}
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

export { COLOR_PRESETS, NAVY_INTENSITIES };
export type { ColorPreset, NavyIntensity };
