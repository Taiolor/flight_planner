import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

describe("convenção de companhias aéreas em caixa alta", () => {
  const read = (path: string) => readFileSync(path, "utf8");

  it("mantém os dados e mapas visuais padronizados", () => {
    expect(read("client/src/lib/flightData.ts")).toContain('name: "GOL"');
    expect(read("client/src/lib/flightData.ts")).toContain('name: "AZUL"');
    expect(read("client/src/lib/calendarHelper.ts")).toContain('gol: "GOL LINHAS AÉREAS"');
    expect(read("client/src/lib/calendarHelper.ts")).toContain('azul: "AZUL LINHAS AÉREAS"');
  });

  it("aplica o normalizador nas telas que apresentam companhias", () => {
    expect(read("client/src/pages/FlightQuotes.tsx")).toContain("formatAirlineDisplayName(quote.outboundAirline)");
    expect(read("client/src/components/AdditionalFlightsPanel.tsx")).toContain("formatAirlineDisplayName(flight.departureAirline");
    expect(read("client/src/components/WeeklyPlanning.tsx")).toContain("AirlineBadge airline={item.airline}");
    expect(read("client/src/pages/Memories.tsx")).toContain("formatAirlineDisplayName(segment.airline");
    expect(read("client/src/components/FinancialCharts.tsx")).toContain("formatAirlineDisplayName(entry.name)");
    expect(read("client/src/components/flights/FlightPopup.tsx")).toContain("AirlineBadge airline={w.departureAirline}");
  });
});
