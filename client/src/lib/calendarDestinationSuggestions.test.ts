import { describe, expect, it } from "vitest";
import { getCalendarDestinationSuggestions } from "./calendarDestinationSuggestions";

describe("getCalendarDestinationSuggestions", () => {
  it("sugere destinos por nome normalizado e código de aeroporto", () => {
    expect(getCalendarDestinationSuggestions("nave")).toContainEqual({
      airportCode: "NVT",
      destination: "Aeroporto Internacional de Navegantes (NVT)",
    });
    expect(getCalendarDestinationSuggestions("gru")).toContainEqual({
      airportCode: "GRU",
      destination: "Aeroporto Internacional de Guarulhos (GRU)",
    });
  });

  it("não abre sugestões para termos muito curtos ou limites inválidos", () => {
    expect(getCalendarDestinationSuggestions("n")).toEqual([]);
    expect(getCalendarDestinationSuggestions("navegantes", 0)).toEqual([]);
  });
});
