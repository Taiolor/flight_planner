/** @vitest-environment jsdom */

import React, { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, describe, expect, it, vi } from "vitest";
import {
  AdditionalFlightsPanel,
  normalizeAdditionalFlightDraft,
  validateAdditionalFlightDraft,
  type AdditionalFlightRecord,
} from "./AdditionalFlightsPanel";

vi.mock("@/lib/trpc", () => ({
  trpc: {
    additionalFlights: {
      create: { useMutation: () => ({ isPending: false, mutateAsync: vi.fn() }) },
      update: { useMutation: () => ({ isPending: false, mutateAsync: vi.fn() }) },
      delete: { useMutation: () => ({ isPending: false, mutateAsync: vi.fn() }) },
    },
  },
}));

vi.mock("sonner", () => ({ toast: { success: vi.fn(), error: vi.fn() } }));

Reflect.set(globalThis, "IS_REACT_ACT_ENVIRONMENT", true);

type Draft = Parameters<typeof normalizeAdditionalFlightDraft>[0];

function makeDraft(overrides: Partial<Draft> = {}): Draft {
  return {
    isTicketIssued: 1,
    departureAirline: "LATAM",
    returnAirline: "LATAM",
    departureFlightDatetime: "2027-01-11T09:00",
    returnFlightDatetime: "2027-01-14T19:00",
    departureAirport: "GRU",
    returnAirport: "NVT",
    departureLocator: "ABC123",
    returnLocator: "XYZ789",
    departureFlightNumber: "LA1234",
    returnFlightNumber: "LA5678",
    departureTerminal: "2",
    returnTerminal: "1",
    ticketType: "roundtrip",
    smilesPoints: null,
    latamPassPoints: null,
    departureRescheduled: 0,
    returnRescheduled: 0,
    departureCancelled: 0,
    returnCancelled: 0,
    ...overrides,
  };
}

function makeFlight(
  overrides: Partial<AdditionalFlightRecord> = {}
): AdditionalFlightRecord {
  return {
    id: 9,
    year: 2027,
    weekNumber: 2,
    isTicketIssued: 1,
    departureAirline: "LATAM",
    returnAirline: "LATAM",
    departureFlightDatetime: "2027-01-11T09:00",
    returnFlightDatetime: "2027-01-14T19:00",
    departureAirport: "GRU",
    returnAirport: "NVT",
    departureLocator: "ABC123",
    returnLocator: "XYZ789",
    departureFlightNumber: "LA1234",
    returnFlightNumber: "LA5678",
    departureTerminal: "2",
    returnTerminal: "1",
    ticketType: "roundtrip",
    smilesPoints: null,
    latamPassPoints: null,
    departureRescheduled: 0,
    returnRescheduled: 0,
    departureCancelled: 0,
    returnCancelled: 0,
    ...overrides,
  };
}

let root: Root | null = null;
let host: HTMLDivElement | null = null;

function renderPanel(flights: AdditionalFlightRecord[]) {
  host = document.createElement("div");
  document.body.appendChild(host);
  root = createRoot(host);
  act(() => {
    root?.render(
      <AdditionalFlightsPanel
        year={2027}
        weekNumber={2}
        weekStartDate="2027-01-10"
        weekEndDate="2027-01-16"
        flights={flights}
        onChanged={vi.fn()}
      />
    );
  });
  return host;
}

function click(element: Element) {
  act(() => {
    element.dispatchEvent(new MouseEvent("click", { bubbles: true }));
  });
}

afterEach(() => {
  act(() => root?.unmount());
  host?.remove();
  root = null;
  host = null;
  document.body.replaceChildren();
});

describe("AdditionalFlightsPanel form rules", () => {
  it("removes all return fields when the ticket is one-way", () => {
    const normalized = normalizeAdditionalFlightDraft(
      makeDraft({ ticketType: "oneway" })
    );

    expect(normalized).toMatchObject({
      ticketType: "oneway",
      returnAirline: null,
      returnFlightDatetime: null,
      returnFlightNumber: null,
      returnLocator: null,
      returnTerminal: null,
      returnCancelled: 0,
      returnRescheduled: 0,
    });
  });

  it("requires the outbound datetime before an issued ticket can be saved", () => {
    const error = validateAdditionalFlightDraft(
      makeDraft({ departureFlightDatetime: null }),
      "2027-01-10",
      "2027-01-16"
    );

    expect(error).toBe(
      "Informe a data e hora do voo de ida antes de emitir a passagem adicional."
    );
  });

  it("rejects flight dates outside the selected week period", () => {
    const error = validateAdditionalFlightDraft(
      makeDraft({ departureFlightDatetime: "2027-01-17T09:00" }),
      "2027-01-10",
      "2027-01-16"
    );

    expect(error).toBe(
      "A data da ida deve estar dentro do período da semana selecionada."
    );
  });

  it("rejects a return that occurs before the outbound flight", () => {
    const error = validateAdditionalFlightDraft(
      makeDraft({ returnFlightDatetime: "2027-01-10T19:00" }),
      "2027-01-10",
      "2027-01-16"
    );

    expect(error).toBe("A volta não pode ocorrer antes da ida.");
  });

  it("opens the additional-ticket form with the selected week as the date boundary", () => {
    const container = renderPanel([]);
    const createButton = container.querySelector<HTMLButtonElement>(
      'button[aria-label="Adicionar passagem adicional"]'
    );

    expect(createButton).toBeTruthy();
    click(createButton!);

    expect(container.textContent).toContain("Adicionar passagem adicional");
    expect(container.textContent).toContain("2027-01-10 a 2027-01-16");
    const datetimeInput = container.querySelector<HTMLInputElement>(
      'input[type="datetime-local"]'
    );
    expect(datetimeInput?.min).toBe("2027-01-10T00:00");
    expect(datetimeInput?.max).toBe("2027-01-16T23:59");
  });

  it("asks for confirmation before deleting an additional ticket", () => {
    const container = renderPanel([makeFlight({ ticketType: "oneway" })]);
    const expandButton = Array.from(container.querySelectorAll("button")).find(
      button => button.textContent?.includes("Passagens adicionais")
    );

    expect(expandButton).toBeTruthy();
    click(expandButton!);

    const deleteButton = container.querySelector<HTMLButtonElement>(
      'button[aria-label="Remover passagem adicional"]'
    );
    expect(deleteButton).toBeTruthy();
    click(deleteButton!);

    expect(document.body.textContent).toContain("Excluir passagem adicional?");
    expect(document.body.textContent).toContain("semana 2");
    expect(document.body.textContent).toContain("somente de ida");
  });
});
