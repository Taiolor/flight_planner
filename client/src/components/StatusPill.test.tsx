/** @vitest-environment jsdom */
import React from "react";
import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { StatusPill } from "./StatusPill";

describe("StatusPill", () => {
  it("combina o estado cancelado com o rótulo textual obrigatório", () => {
    render(<StatusPill tone="cancelled">Cancelado</StatusPill>);

    const pill = screen.getByText("Cancelado");
    expect(pill.className).toContain("bg-[#4B0082]");
    expect(pill.className).toContain("text-white");
  });
});
