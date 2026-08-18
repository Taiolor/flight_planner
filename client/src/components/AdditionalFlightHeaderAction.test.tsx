/** @vitest-environment jsdom */

import React, { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, describe, expect, it, vi } from "vitest";
import { AdditionalFlightHeaderAction } from "./AdditionalFlightHeaderAction";

Reflect.set(globalThis, "IS_REACT_ACT_ENVIRONMENT", true);

let root: Root | null = null;
let host: HTMLDivElement | null = null;

afterEach(() => {
  act(() => root?.unmount());
  host?.remove();
  root = null;
  host = null;
  document.body.replaceChildren();
});

describe("AdditionalFlightHeaderAction", () => {
  it("keeps the add action available for a week regardless of its ticket status", () => {
    const onRequest = vi.fn();
    host = document.createElement("div");
    document.body.appendChild(host);
    root = createRoot(host);

    act(() => {
      root?.render(
        <AdditionalFlightHeaderAction weekNumber={18} onRequest={onRequest} />
      );
    });

    const button = host.querySelector<HTMLButtonElement>(
      'button[aria-label="Adicionar passagem na semana 18"]'
    );
    expect(button).toBeTruthy();

    act(() => {
      button?.dispatchEvent(new MouseEvent("click", { bubbles: true }));
    });

    expect(onRequest).toHaveBeenCalledWith(18);
  });
});
