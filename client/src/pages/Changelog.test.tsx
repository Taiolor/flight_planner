import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { releases } from "./Changelog";

describe("Novidades de agosto de 2026", () => {
  const source = readFileSync("client/src/pages/Changelog.tsx", "utf8");

  it("consolida as evoluções entregues até o fim de agosto em v2.0.0", () => {
    const release = releases.find(item => item.version === "v2.0.0");

    expect(release).toMatchObject({
      date: "29/08/2026",
      month: "Agosto 2026",
      status: "released",
    });
    expect(release?.features.map(feature => feature.category)).toEqual(
      expect.arrayContaining([
        "Central de Decisão e Planejamento Diário",
        "Clima e Detalhes de Bilhetes",
        "PWA, Offline e Disponibilidade",
        "Experiência Móvel e Cabeçalho",
        "Design System Operacional",
        "Confiabilidade e Qualidade",
      ])
    );
    expect(source).toContain('new Set(["v2.0.0"])');
    expect(source).toContain(">772</div>");
    expect(source).toContain(">90+</div>");
  });

  it("publica o ciclo completo das últimas duas semanas em v1.9.0", () => {
    const release = releases.find(item => item.version === "v1.9.0");

    expect(release).toMatchObject({
      date: "22/08/2026",
      month: "Agosto 2026",
      status: "released",
    });
    expect(release?.features.map(feature => feature.category)).toEqual(
      expect.arrayContaining([
        "Gestão de Passagens e Bilhetes",
        "Calendário com Datas Efetivas",
        "Planejamento, Metas e Financeiro",
        "Experiência e Acessibilidade",
        "Telemetria e Fly.IA",
        "Confiabilidade e Qualidade",
      ])
    );
    expect(source).toContain('new Set(["v2.0.0"])');
    expect(source).toContain(">772</div>");
  });

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
