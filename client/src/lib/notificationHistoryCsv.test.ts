import { describe, expect, it } from "vitest";
import { buildNotificationHistoryCsv } from "./notificationHistoryCsv";

describe("buildNotificationHistoryCsv", () => {
  it("inclui cabeçalhos, status legíveis e protege campos com delimitadores", () => {
    const csv = buildNotificationHistoryCsv([
      {
        sentAt: "2026-08-25T15:30:00.000Z",
        status: "failed",
        isTest: 1,
        weekNumber: 34,
        direction: "ida",
        avisoLabel: "24h antes",
        airline: "LATAM",
        flightNumber: "LA;1234",
        devicesReached: 0,
        totalDevices: 2,
        errorMessage: "Falha: \"token\" inválido",
      },
    ]);

    expect(csv.startsWith("\ufeffEnviado em;Status;Tipo")).toBe(true);
    expect(csv).toContain("Falha;Teste manual;34;Ida");
    expect(csv).toContain('"LA;1234"');
    expect(csv).toContain('"Falha: ""token"" inválido"');
  });
});
