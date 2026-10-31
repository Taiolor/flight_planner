// @vitest-environment jsdom
import React from "react";
import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import {
  MemoriesMetricsLoadingSkeleton,
  MemoriesTimelineLoadingSkeleton,
  YearRouteLoadingSkeleton,
} from "./MemoriesLoadingSkeleton";

describe("MemoriesLoadingSkeleton", () => {
  it("expõe estados de carregamento acessíveis para rota, indicadores e linha do tempo", () => {
    render(
      <>
        <YearRouteLoadingSkeleton />
        <MemoriesMetricsLoadingSkeleton />
        <MemoriesTimelineLoadingSkeleton />
      </>
    );

    expect(screen.getByRole("status", { name: "Carregando rota do ano" }).getAttribute("aria-busy")).toBe("true");
    expect(screen.getByRole("status", { name: "Carregando indicadores de Memórias" }).getAttribute("aria-busy")).toBe("true");
    expect(screen.getByRole("status", { name: "Carregando linha do tempo de Memórias" }).getAttribute("aria-busy")).toBe("true");
  });
});
