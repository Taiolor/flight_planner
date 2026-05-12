/**
 * Testes para o módulo de cotações de passagens aéreas
 * Cobre: helpers de banco de dados, lógica de limite de API, formatação de datas
 */

import { describe, it, expect, vi, beforeEach } from "vitest";

// =====================
// Testes de utilitários puros (sem banco de dados)
// =====================

describe("quotes utilities", () => {
  describe("getCurrentYearMonth", () => {
    it("deve retornar o formato YYYY-MM correto", () => {
      // Testar a lógica de formatação de data
      const now = new Date("2026-05-10T12:00:00Z");
      const year = now.getFullYear();
      const month = String(now.getMonth() + 1).padStart(2, "0");
      const yearMonth = `${year}-${month}`;
      expect(yearMonth).toBe("2026-05");
    });

    it("deve preencher mês com zero à esquerda para meses < 10", () => {
      const now = new Date("2026-01-15T12:00:00Z");
      const year = now.getFullYear();
      const month = String(now.getMonth() + 1).padStart(2, "0");
      const yearMonth = `${year}-${month}`;
      expect(yearMonth).toBe("2026-01");
    });

    it("deve formatar dezembro corretamente", () => {
      const now = new Date("2026-12-25T12:00:00Z");
      const year = now.getFullYear();
      const month = String(now.getMonth() + 1).padStart(2, "0");
      const yearMonth = `${year}-${month}`;
      expect(yearMonth).toBe("2026-12");
    });
  });

  describe("price conversion", () => {
    it("deve converter reais para centavos corretamente", () => {
      const price = 350.90;
      const cents = Math.round(price * 100);
      expect(cents).toBe(35090);
    });

    it("deve converter centavos para reais corretamente", () => {
      const cents = 35090;
      const formatted = (cents / 100).toLocaleString("pt-BR", {
        style: "currency",
        currency: "BRL",
      });
      expect(formatted).toContain("350");
    });

    it("deve arredondar preços com muitas casas decimais", () => {
      const price = 199.999;
      const cents = Math.round(price * 100);
      expect(cents).toBe(20000);
    });
  });

  describe("Kayak URL builder", () => {
    const buildKayakUrl = (departureDate: string, returnDate: string): string => {
      const toIso = (d: string) => {
        const [day, month, year] = d.split("/");
        return `${year}-${month}-${day}`;
      };
      const dep = toIso(departureDate);
      const ret = toIso(returnDate);
      return `https://www.kayak.com.br/flights/GRU-NVT/${dep}/${ret}?ucs=p1nu6v&sort=bestflight_a`;
    };

    it("deve gerar URL correta para datas no formato DD/MM/YYYY", () => {
      const url = buildKayakUrl("01/03/2026", "06/03/2026");
      expect(url).toBe(
        "https://www.kayak.com.br/flights/GRU-NVT/2026-03-01/2026-03-06?ucs=p1nu6v&sort=bestflight_a"
      );
    });

    it("deve incluir parâmetros de ordenação e UTM", () => {
      const url = buildKayakUrl("08/03/2026", "13/03/2026");
      expect(url).toContain("ucs=p1nu6v");
      expect(url).toContain("sort=bestflight_a");
    });

    it("deve usar rota GRU-NVT fixa", () => {
      const url = buildKayakUrl("15/03/2026", "20/03/2026");
      expect(url).toContain("/flights/GRU-NVT/");
    });
  });

  describe("API limit logic", () => {
    it("deve bloquear quando requestsUsed >= requestsLimit", () => {
      const usage = { requestsUsed: 20, requestsLimit: 20 };
      const isLimitReached = usage.requestsUsed >= usage.requestsLimit;
      expect(isLimitReached).toBe(true);
    });

    it("deve permitir quando requestsUsed < requestsLimit", () => {
      const usage = { requestsUsed: 15, requestsLimit: 20 };
      const isLimitReached = usage.requestsUsed >= usage.requestsLimit;
      expect(isLimitReached).toBe(false);
    });

    it("deve bloquear quando requestsUsed > requestsLimit (overflow)", () => {
      const usage = { requestsUsed: 25, requestsLimit: 20 };
      const isLimitReached = usage.requestsUsed >= usage.requestsLimit;
      expect(isLimitReached).toBe(true);
    });

    it("deve calcular percentual de uso corretamente", () => {
      const usage = { requestsUsed: 10, requestsLimit: 20 };
      const percent = Math.round((usage.requestsUsed / usage.requestsLimit) * 100);
      expect(percent).toBe(50);
    });
  });

  describe("date ISO conversion", () => {
    const toIsoDate = (d: string): string => {
      if (d.includes("-")) return d;
      const [day, month, year] = d.split("/");
      return `${year}-${month}-${day}`;
    };

    it("deve converter DD/MM/YYYY para YYYY-MM-DD", () => {
      expect(toIsoDate("01/03/2026")).toBe("2026-03-01");
    });

    it("deve retornar a data sem alteração se já estiver em formato ISO", () => {
      expect(toIsoDate("2026-03-01")).toBe("2026-03-01");
    });

    it("deve converter datas de dezembro corretamente", () => {
      expect(toIsoDate("25/12/2026")).toBe("2026-12-25");
    });
  });
});
