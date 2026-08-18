import { describe, expect, it } from "vitest";
import {
  canRecordPerformanceTelemetry,
  getSafeRoute,
  getTrpcProcedure,
} from "./performanceTelemetry";

describe("telemetria de performance", () => {
  it("mantém somente rotas sem parâmetros ou identificadores pessoais", () => {
    expect(getSafeRoute("/financeiro")).toBe("/financeiro");
    expect(getSafeRoute("/cotacoes?ano=2027")).toBe("/");
  });

  it("extrai somente nomes válidos de procedimentos tRPC", () => {
    expect(getTrpcProcedure("/api/trpc/flights.getWeeks?batch=1")).toBe(
      "flights.getWeeks"
    );
    expect(getTrpcProcedure("/api/trpc/../../secret")).toBeUndefined();
    expect(getTrpcProcedure("/calendar")).toBeUndefined();
  });

  it("só permite coleta quando a sessão interna protegida está autenticada", () => {
    expect(canRecordPerformanceTelemetry(false)).toBe(false);
    expect(canRecordPerformanceTelemetry(true)).toBe(true);
  });
});
