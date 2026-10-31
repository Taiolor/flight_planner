import { describe, expect, it } from "vitest";
import {
  approximatePosition,
  createUsageTelemetrySessionId,
  getSafeUsageRoute,
  markUsageTelemetryActiveNoticeShown,
  shouldShowUsageTelemetryActiveNotice,
} from "./usageTelemetry";

describe("telemetria de uso consentida", () => {
  it("reduz coordenadas para centésimos de grau antes do envio", () => {
    expect(approximatePosition(-23.55052, -46.633308)).toEqual({
      latitudeE2: -2355,
      longitudeE2: -4663,
    });
  });

  it("descarta coordenadas inválidas em vez de persistir localização", () => {
    expect(approximatePosition(91, 0)).toBeUndefined();
    expect(approximatePosition(0, 181)).toBeUndefined();
    expect(approximatePosition(Number.NaN, 0)).toBeUndefined();
  });

  it("mantém somente rotas sem parâmetros e cria nonce efêmero não identificável", () => {
    expect(getSafeUsageRoute("/admin/telemetria")).toBe("/admin/telemetria");
    expect(getSafeUsageRoute("/?email=private@example.com")).toBe("/");
    expect(createUsageTelemetrySessionId()).toMatch(/^[a-f0-9]{32}$/);
  });

  it("marca o aviso ativo como já exibido no próximo carregamento da sessão", () => {
    const values = new Map<string, string>();
    const storage = {
      getItem: (key: string) => values.get(key) ?? null,
      setItem: (key: string, value: string) => values.set(key, value),
      removeItem: (key: string) => values.delete(key),
    };

    expect(shouldShowUsageTelemetryActiveNotice(storage)).toBe(true);
    markUsageTelemetryActiveNoticeShown(storage);
    expect(shouldShowUsageTelemetryActiveNotice(storage)).toBe(false);
  });
});
