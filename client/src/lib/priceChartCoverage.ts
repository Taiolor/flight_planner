import type { MonthlyChartData } from "@/components/HomeCharts";

export type PriceChartCoverage = {
  selectedAirlines: number;
  populatedMonths: number;
  monthlyReferences: number;
};

/** Resume somente os pontos realmente disponíveis no gráfico para evitar métricas artificiais. */
export function getPriceChartCoverage(
  chartData: MonthlyChartData[],
  selectedAirlines: Set<string>
): PriceChartCoverage {
  const selectedIds = [...selectedAirlines];
  const availableValues = chartData.flatMap(month =>
    selectedIds.filter(airlineId => {
      const value = month[airlineId];
      return typeof value === "number" && value > 0;
    })
  );

  return {
    selectedAirlines: selectedIds.length,
    populatedMonths: chartData.filter(month =>
      selectedIds.some(airlineId => {
        const value = month[airlineId];
        return typeof value === "number" && value > 0;
      })
    ).length,
    monthlyReferences: availableValues.length,
  };
}
