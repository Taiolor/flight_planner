import { describe, expect, it } from "vitest";
import { getTelemetryPeriodTotalLabel } from "./telemetryPeriodTotals";

describe("getTelemetryPeriodTotalLabel", () => {
  it("mantém o indicador de carregamento enquanto o total ainda não chegou", () => {
    expect(getTelemetryPeriodTotalLabel({ isLoading: true, isError: false, total: 0 })).toBe("…");
  });

  it("não apresenta zero enganoso quando a consulta do período falha", () => {
    expect(getTelemetryPeriodTotalLabel({ isLoading: false, isError: true, total: 0 })).toBe("—");
  });

  it("formata o total disponível em português brasileiro", () => {
    expect(getTelemetryPeriodTotalLabel({ isLoading: false, isError: false, total: 1250 })).toBe("1.250");
  });
});
