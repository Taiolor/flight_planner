import { createContext, useContext, useState, ReactNode } from "react";

export const AVAILABLE_PLANNING_YEARS = [2026, 2027, 2028, 2029, 2030];
export const DEFAULT_PLANNING_YEAR = 2026;

export function normalizePlanningYear(value: number | null | undefined) {
  return value && AVAILABLE_PLANNING_YEARS.includes(value)
    ? value
    : DEFAULT_PLANNING_YEAR;
}

interface YearContextType {
  selectedYear: number;
  setSelectedYear: (year: number) => void;
  availableYears: number[];
}

const YearContext = createContext<YearContextType | undefined>(undefined);

export function YearProvider({ children }: { children: ReactNode }) {
  const [selectedYear, setSelectedYear] = useState<number>(() => {
    if (typeof window === "undefined") return DEFAULT_PLANNING_YEAR;

    const fromUrl = Number(
      new URLSearchParams(window.location.search).get("ano")
    );
    const fromStorage = Number(localStorage.getItem("selectedYear"));
    return normalizePlanningYear(fromUrl || fromStorage);
  });

  const handleSetSelectedYear = (year: number) => {
    const normalizedYear = normalizePlanningYear(year);
    setSelectedYear(normalizedYear);

    if (typeof window !== "undefined") {
      localStorage.setItem("selectedYear", normalizedYear.toString());
      const url = new URL(window.location.href);
      url.searchParams.set("ano", normalizedYear.toString());
      window.history.replaceState({}, "", `${url.pathname}${url.search}${url.hash}`);
    }
  };

  return (
    <YearContext.Provider
      value={{
        selectedYear,
        setSelectedYear: handleSetSelectedYear,
        availableYears: AVAILABLE_PLANNING_YEARS,
      }}
    >
      {children}
    </YearContext.Provider>
  );
}

export function useYear() {
  const context = useContext(YearContext);
  if (!context) {
    throw new Error("useYear deve ser usado dentro de YearProvider");
  }
  return context;
}
