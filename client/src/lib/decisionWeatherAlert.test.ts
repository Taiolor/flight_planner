import { describe, expect, it } from "vitest";
import { buildRainDecisionItem, getNextDecisionWeatherTarget } from "./decisionWeatherAlert";

describe("alerta meteorológico da Central de Decisão", () => {
  const week = {
    weekNumber: 27,
    departureDate: "30/08/2026",
    returnDate: "04/09/2026",
    isDeleted: 0,
    isTicketIssued: 1,
    departureAirport: "GRU",
    returnAirport: "NVT",
    ticketType: "roundtrip" as const,
  };

  it("prioriza o próximo trecho não cancelado dentro de cinco dias", () => {
    expect(getNextDecisionWeatherTarget([week], new Date(2026, 7, 27))).toMatchObject({
      weekNumber: 27,
      direction: "departure",
      airportCode: "NVT",
      flightDate: "2026-08-30",
      daysUntil: 3,
    });
  });

  it("cria uma prioridade de chuva apenas acima do limiar e aumenta urgência próxima", () => {
    const target = getNextDecisionWeatherTarget([week], new Date(2026, 7, 29));
    const item = buildRainDecisionItem(target, {
      available: true,
      forecastDate: "2026-08-30",
      dailyForecast: [{ date: "2026-08-30", summary: "Chuva moderada", precipitationProbability: 78 }],
    });

    expect(item).toMatchObject({
      kind: "weather",
      severity: "critical",
      destination: "calendar",
      title: "Chuva prevista para a semana 27",
    });
    expect(item?.reason).toContain("78% de chance de chuva");
    expect(buildRainDecisionItem(target, {
      available: true,
      dailyForecast: [{ date: "2026-08-30", summary: "Céu limpo", precipitationProbability: 20 }],
    })).toBeNull();
  });
});
