/** @vitest-environment jsdom */
import React from "react";
import { fireEvent, render, screen } from "@testing-library/react";
import { act } from "react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { MobileLongPressHint } from "./MobileLongPressHint";

describe("MobileLongPressHint", () => {
  afterEach(() => vi.useRealTimers());

  it("exibe uma dica após toque prolongado sem exibi-la para mouse", () => {
    vi.useFakeTimers();
    const { container } = render(
      <MobileLongPressHint label="Calendário">
        <button type="button">Abrir</button>
      </MobileLongPressHint>
    );
    const wrapper = container.firstElementChild!;

    fireEvent.pointerDown(wrapper, { pointerType: "touch" });
    act(() => vi.advanceTimersByTime(550));
    expect(screen.getByRole("tooltip", { name: "Calendário" })).toBeTruthy();

    fireEvent.pointerDown(wrapper, { pointerType: "mouse" });
    expect(screen.getByRole("tooltip", { name: "Calendário" })).toBeTruthy();
  });
});
