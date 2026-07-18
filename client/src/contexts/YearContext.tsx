import { createContext, useContext, useState, ReactNode } from "react";

interface YearContextType {
  selectedYear: number;
  setSelectedYear: (year: number) => void;
}

const YearContext = createContext<YearContextType | undefined>(undefined);

export function YearProvider({ children }: { children: ReactNode }) {
  const [selectedYear, setSelectedYear] = useState<number>(() => {
    const saved = localStorage.getItem("selectedYear");
    return saved ? parseInt(saved, 10) : new Date().getFullYear();
  });

  const handleSetSelectedYear = (year: number) => {
    setSelectedYear(year);
    localStorage.setItem("selectedYear", year.toString());
  };

  return (
    <YearContext.Provider value={{ selectedYear, setSelectedYear: handleSetSelectedYear }}>
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
