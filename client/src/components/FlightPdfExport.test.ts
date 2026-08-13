import { describe, expect, it } from "vitest";
import {
  formatAirlineName,
  formatLocator,
  formatRescheduleStatus,
} from "./FlightPdfExport";

describe("FlightPdfExport helpers", () => {
  it("mantém o localizador individual de cada trecho", () => {
    expect(formatLocator(" ABC123 ")).toBe("ABC123");
    expect(formatLocator("XYZ987")).toBe("XYZ987");
  });

  it("informa quando o localizador não foi preenchido", () => {
    expect(formatLocator(null)).toBe("Não informado");
    expect(formatLocator("   ")).toBe("Não informado");
  });

  it("padroniza o nome da companhia em maiúsculas", () => {
    expect(formatAirlineName("Latam")).toBe("LATAM");
    expect(formatAirlineName(" azul ")).toBe("AZUL");
    expect(formatAirlineName(null)).toBe("Não informado");
  });

  it("exibe o status de remarcação por trecho", () => {
    expect(formatRescheduleStatus(1)).toBe("Remarcado");
    expect(formatRescheduleStatus(true)).toBe("Remarcado");
    expect(formatRescheduleStatus(0)).toBe("Não remarcado");
    expect(formatRescheduleStatus(false)).toBe("Não remarcado");
  });
});
