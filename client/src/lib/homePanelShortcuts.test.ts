/** @vitest-environment jsdom */
import React from "react";
import { fireEvent, render } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { isPanelToggleShortcut, useHomePanelToggleShortcut } from "./homePanelShortcuts";

describe("atalho de painéis da Home", () => {
  it("reconhece Alt + Shift + E fora de campos editáveis", () => {
    expect(
      isPanelToggleShortcut({
        altKey: true,
        shiftKey: true,
        key: "E",
        target: document.body,
      })
    ).toBe(true);
  });

  it("ignora o atalho enquanto a pessoa digita em campos editáveis", () => {
    const input = document.createElement("input");

    expect(
      isPanelToggleShortcut({
        altKey: true,
        shiftKey: true,
        key: "e",
        target: input,
      })
    ).toBe(false);
  });

  it("aciona o callback global somente fora de campos editáveis", () => {
    const onToggle = vi.fn();
    function ShortcutHarness() {
      useHomePanelToggleShortcut(onToggle);
      return React.createElement("input", { "aria-label": "Campo de teste" });
    }

    render(React.createElement(ShortcutHarness));

    fireEvent.keyDown(window, { altKey: true, shiftKey: true, key: "e" });
    fireEvent.keyDown(document.querySelector("input")!, {
      altKey: true,
      shiftKey: true,
      key: "e",
    });

    expect(onToggle).toHaveBeenCalledOnce();
  });
});
