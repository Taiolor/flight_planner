import { CalendarDays } from "lucide-react";
import { useYear } from "@/contexts/YearContext";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface GlobalYearSelectorProps {
  className?: string;
  compact?: boolean;
}

export function GlobalYearSelector({
  className = "",
  compact = false,
}: GlobalYearSelectorProps) {
  const { selectedYear, setSelectedYear, availableYears } = useYear();

  return (
    <Select
      value={selectedYear.toString()}
      onValueChange={value => setSelectedYear(Number(value))}
    >
      <SelectTrigger
        aria-label="Selecionar ano do planejamento"
        className={`w-auto min-w-[104px] ${className}`}
      >
        <CalendarDays className="h-4 w-4 shrink-0" />
        {!compact && <span className="hidden sm:inline text-xs">Ano</span>}
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        {availableYears.map(year => (
          <SelectItem key={year} value={year.toString()}>
            {year}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
