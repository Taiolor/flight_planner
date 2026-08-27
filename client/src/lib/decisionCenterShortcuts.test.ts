/** @vitest-environment jsdom */
import React from "react";
import { fireEvent, render } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import {
  isDecisionCenterToggleShortcut,
  useDecisionCenterToggleShortcut,
} from "./decisionCenterShortcuts";

describe("atalho da Central de decisão", () => {
  it("reconhece Alt + Shift + D fora de campos editáveis", () => {
    expect(isDecisionCenterToggleShortcut({ altKey: true, shiftKey: true, key: "D", target: document.body })).toBe(true);
  });

  it("ignora o comando enquanto a pessoa digita", () => {
    const input = document.createElement("input");
    expect(isDecisionCenterToggleShortcut({ altKey: true, shiftKey: true, key: "d", target: input })).toBe(false);
  });

  it("aciona a sanfona somente fora de campos editáveis", () => {
    const onToggle = vi.fn();
    function ShortcutHarness() {
      useDecisionCenterToggleShortcut(onToggle);
      return React.createElement("input", { "aria-label": "Campo de teste" });
    }

    render(React.createElement(ShortcutHarness));
    fireEvent.keyDown(window, { altKey: true, shiftKey: true, key: "d" });
    fireEvent.keyDown(document.querySelector("input")!, { altKey: true, shiftKey: true, key: "d" });

    expect(onToggle).toHaveBeenCalledOnce();
  });
});
