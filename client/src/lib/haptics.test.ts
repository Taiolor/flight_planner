import { afterEach, describe, expect, it, vi } from "vitest";
import { triggerHaptic } from "./haptics";

describe("feedback háptico", () => {
  afterEach(() => vi.restoreAllMocks());

  it("aciona vibração quando o dispositivo suporta a API", () => {
    const vibrate = vi.fn().mockReturnValue(true);
    Object.defineProperty(navigator, "vibrate", { configurable: true, value: vibrate });

    expect(triggerHaptic(18)).toBe(true);
    expect(vibrate).toHaveBeenCalledWith(18);
  });

  it("falha de forma segura quando a API não está disponível", () => {
    Object.defineProperty(navigator, "vibrate", { configurable: true, value: undefined });
    expect(triggerHaptic()).toBe(false);
  });
});
