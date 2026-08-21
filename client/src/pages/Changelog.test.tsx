import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { releases } from "./Changelog";

describe("Novidades de agosto de 2026", () => {
  const source = readFileSync("client/src/pages/Changelog.tsx", "utf8");

  it("publica a release v1.8.0 com a evolução recente de Viagens", () => {
    const release = releases.find(item => item.version === "v1.8.0");

    expect(release).toMatchObject({
      date: "18/08/2026",
      month: "Agosto 2026",
      status: "released",
    });
    expect(release?.features.map(feature => feature.category)).toEqual(
      expect.arrayContaining([
        "Mais Opções para Cada Semana",
        "Memórias de Viagem",
        "Performance e Confiabilidade",
        "Segurança e Administração",
        "Identidade Viagens",
      ])
    );
  });

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

  it("mantém o cabeçalho no gradiente azul-marinho compartilhado", () => {
    expect(source).toContain("from-[#071a36] via-[#102f61] to-[#17427e]");
  });
});
