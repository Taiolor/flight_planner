import { beforeEach, describe, expect, it } from "vitest";
// @vitest-environment jsdom
import {
  buildAttentionItems,
  dismissAttentionItem,
  readAttentionDismissals,
  restoreAttentionItem,
} from "./attentionCenter";

describe("Central de atenção inteligente", () => {
  const now = new Date(2026, 7, 19);

  beforeEach(() => window.localStorage.clear());

  it("prioriza cancelamentos e compras não emitidas nos próximos 15 dias", () => {
    const items = buildAttentionItems(
      [
        {
          weekNumber: 34,
          departureDate: "25/08/2026",
          isTicketIssued: 0,
          departureCancelled: 1,
        },
        {
          weekNumber: 35,
          departureDate: "01/09/2026",
          isTicketIssued: 0,
        },
        {
          weekNumber: 36,
          departureDate: "15/09/2026",
          isTicketIssued: 1,
        },
      ],
      {},
      now
    );

    expect(items.map(item => item.kind)).toEqual(["cancellation", "deadline", "deadline"]);
    expect(items[0]).toMatchObject({ severity: "critical", weekNumber: 34 });
    expect(items).not.toContainEqual(expect.objectContaining({ weekNumber: 36, kind: "deadline" }));
  });

  it("sinaliza uma cotação pelo menos 20% acima da referência anual", () => {
    const items = buildAttentionItems(
      [
        { weekNumber: 34, departureDate: "25/08/2026", isTicketIssued: 0 },
        { weekNumber: 35, departureDate: "10/09/2026", isTicketIssued: 0 },
        { weekNumber: 36, departureDate: "20/09/2026", isTicketIssued: 0 },
      ],
      {
        34: { azul: "500" },
        35: { gol: "500" },
        36: { latam: "700" },
      },
      now
    );

    expect(items).toContainEqual(
      expect.objectContaining({
        kind: "price",
        weekNumber: 36,
        severity: "warning",
        variationPercent: 40,
      })
    );
  });

  it("ignora semanas removidas e voos que já ficaram no passado", () => {
    const items = buildAttentionItems(
      [
        {
          weekNumber: 20,
          departureDate: "10/05/2026",
          isTicketIssued: 0,
          departureCancelled: 1,
        },
        {
          weekNumber: 21,
          departureDate: "26/08/2026",
          isTicketIssued: 0,
          isDeleted: 1,
        },
      ],
      {},
      now
    );

    expect(items).toEqual([]);
  });

  it("mantém um alerta adiado por 24 horas e permite reativá-lo", () => {
    const first = dismissAttentionItem("purchase-deadline-34", now);
    expect(first["purchase-deadline-34"]).toBe("2026-08-20T00:00:00.000Z");
    expect(readAttentionDismissals(now)).toEqual(first);

    const restored = restoreAttentionItem("purchase-deadline-34", now);
    expect(restored).toEqual({});
  });

  it("remove automaticamente um alerta cuja dispensa expirou", () => {
    dismissAttentionItem("price-variation-36", now);
    const nextDay = new Date(now.getTime() + 25 * 60 * 60 * 1000);

    expect(readAttentionDismissals(nextDay)).toEqual({});
  });
});
