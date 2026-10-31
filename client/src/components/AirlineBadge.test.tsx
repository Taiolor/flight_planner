// @vitest-environment jsdom
import { render, screen } from "@testing-library/react";
import React from "react";
import { describe, expect, it } from "vitest";
import { AirlineBadge } from "./AirlineBadge";

describe("AirlineBadge", () => {
  it("mostra logo decorativo e nome da companhia em caixa alta", () => {
    render(<AirlineBadge airline="latam" />);

    expect(screen.getByText("LATAM")).toBeTruthy();
    expect(document.querySelector("[data-airline-badge] img")?.getAttribute("alt")).toBe("");
  });

  it("mantém um fallback textual quando não há logo conhecido", () => {
    render(<AirlineBadge airline="Nova Air" fallback="COMPANHIA A DEFINIR" />);

    expect(screen.getByText("NOVA AIR")).toBeTruthy();
  });
});
