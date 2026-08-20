// @vitest-environment jsdom
import React from "react";
import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { CalendarLoadingSkeleton } from "./CalendarLoadingSkeleton";
import { FlightQuotesLoadingSkeleton } from "./FlightQuotesLoadingSkeleton";

describe("PlanningLoadingSkeletons", () => {
  it("expõe o carregamento anual do calendário com os doze meses previstos", () => {
    render(<CalendarLoadingSkeleton />);

    expect(screen.getByRole("status", { name: "Carregando calendário anual" }).getAttribute("aria-busy")).toBe("true");
    expect(screen.getAllByTestId("calendar-month-skeleton")).toHaveLength(12);
  });

  it("expõe o carregamento acessível das cotações com cartões de semanas", () => {
    render(<FlightQuotesLoadingSkeleton year={2028} />);

    expect(screen.getByRole("status", { name: "Carregando cotações de 2028" }).getAttribute("aria-busy")).toBe("true");
    expect(screen.getAllByTestId("quote-week-skeleton")).toHaveLength(8);
  });
});
