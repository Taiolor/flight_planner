import { describe, expect, it } from "vitest";
import { releases } from "./Changelog";

describe("Novidades de agosto de 2026", () => {
  it("publica a release mensal v1.7.0 com as entregas mais recentes", () => {
    const release = releases.find(item => item.version === "v1.7.0");

    expect(release).toMatchObject({
      date: "18/08/2026",
      month: "Agosto 2026",
      status: "released",
    });
    expect(release?.features.map(feature => feature.category)).toEqual(
      expect.arrayContaining([
        "Planejamento Multi-Ano",
        "Notificações Operacionais",
        "Cancelamentos por Trecho",
        "Qualidade, Performance e Segurança",
      ])
    );
  });
});
