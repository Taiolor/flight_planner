import { describe, expect, it } from "vitest";
import {
  calculateGeminiCostCents,
  calculateGeminiCostMicrocents,
  getGeminiBudgetMonth,
  getReachedGeminiBudgetThresholds,
} from "./geminiBudget";

describe("geminiBudget", () => {
  it("calcula a estimativa em centavos a partir de tokens de entrada e saída", () => {
    const cost = calculateGeminiCostCents(
      { inputTokens: 1_000_000, outputTokens: 1_000_000, totalTokens: 2_000_000 },
      { inputCostCentsPerMillion: 165, outputCostCentsPerMillion: 1_375 }
    );

    expect(cost).toBe(1_540);
  });

  it("preserva microcentavos quando uma chamada individual ainda não soma um centavo", () => {
    const usage = { inputTokens: 1, outputTokens: 0, totalTokens: 1 };
    const settings = { inputCostCentsPerMillion: 75, outputCostCentsPerMillion: 375 };

    expect(calculateGeminiCostMicrocents(usage, settings)).toBe(75);
    expect(calculateGeminiCostCents(usage, settings)).toBe(0.000075);
  });

  it("normaliza o mês de consumo no fuso horário de Brasília", () => {
    expect(getGeminiBudgetMonth(new Date("2026-03-01T01:30:00.000Z"))).toBe("2026-02");
  });

  it("seleciona somente as faixas de alerta já cruzadas no ciclo", () => {
    const settings = {
      id: 1,
      monthlyBudgetCents: 10_000,
      inputCostCentsPerMillion: 165,
      outputCostCentsPerMillion: 1_375,
      warningThresholdPercent: 70,
      criticalThresholdPercent: 90,
      limitThresholdPercent: 100,
      emailAlertsEnabled: 1,
      pushAlertsEnabled: 1,
      updatedAt: new Date(),
    };

    expect(getReachedGeminiBudgetThresholds(93, settings)).toEqual([70, 90]);
    expect(getReachedGeminiBudgetThresholds(100, settings)).toEqual([70, 90, 100]);
  });
});
