import { describe, expect, it } from "vitest";
import {
  getDevelopmentCacheNames,
  shouldRegisterServiceWorker,
} from "./serviceWorkerPolicy";

describe("serviceWorkerPolicy", () => {
  it("registra o service worker apenas em produção com suporte disponível", () => {
    expect(shouldRegisterServiceWorker(true, true)).toBe(true);
    expect(shouldRegisterServiceWorker(false, true)).toBe(false);
    expect(shouldRegisterServiceWorker(true, false)).toBe(false);
  });

  it("seleciona somente caches do Smart Fly para limpeza em desenvolvimento", () => {
    expect(
      getDevelopmentCacheNames([
        "smartfly-v4",
        "smartfly-v5",
        "other-app-cache",
      ])
    ).toEqual(["smartfly-v4", "smartfly-v5"]);
  });
});
