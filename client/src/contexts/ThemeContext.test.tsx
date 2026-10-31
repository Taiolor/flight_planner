// @vitest-environment jsdom
import React from "react";
import { readFileSync } from "node:fs";
import { fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { ThemeProvider, useTheme } from "./ThemeContext";

function IntensityProbe() {
  const { navyIntensity, setNavyIntensity } = useTheme();

  return (
    <button type="button" onClick={() => setNavyIntensity("intense")}>
      Intensidade atual: {navyIntensity}
    </button>
  );
}

describe("preferência de intensidade azul-marinho", () => {
  beforeEach(() => {
    window.localStorage.clear();
    document.documentElement.removeAttribute("data-navy-intensity");
  });

  afterEach(() => {
    window.localStorage.clear();
    document.documentElement.removeAttribute("data-navy-intensity");
  });

  it("persiste e reaplica a intensidade intensa com fallback seguro", () => {
    render(
      <ThemeProvider>
        <IntensityProbe />
      </ThemeProvider>
    );

    expect(screen.getByRole("button").textContent).toContain("standard");
    fireEvent.click(screen.getByRole("button"));

    expect(window.localStorage.getItem("smartfly.navy-intensity")).toBe("intense");
    expect(document.documentElement.dataset.navyIntensity).toBe("intense");
  });

  it("cobre as variantes azuis da interface pela escala azul-marinho global", () => {
    const styles = readFileSync("client/src/index.css", "utf8");

    expect(styles).toContain(':root[data-navy-intensity="intense"]');
    expect(styles).toContain(":root[data-navy-intensity] .text-blue-300");
    expect(styles).toContain(":root[data-navy-intensity] .from-blue-600");
    expect(styles).toContain(":root[data-navy-intensity] .ring-blue-200");
    expect(styles).toContain(":root.dark[data-navy-intensity] .dark\\:bg-blue-900");
    expect(styles).toContain(".dark\\:border-blue-900");
  });
});
