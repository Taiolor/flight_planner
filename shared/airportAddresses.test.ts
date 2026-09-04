import { describe, it, expect } from "vitest";
import { getAirportAddress, getAirportName } from "./airportAddresses";

describe("airportAddresses", () => {
  describe("getAirportAddress", () => {
    it("should return the formatted address for a valid uppercase code", () => {
      const address = getAirportAddress("GRU");
      expect(address).toBe(
        "Aeroporto Internacional de São Paulo/Guarulhos - Avenida Monteiro de Carvalho, 1000, Guarulhos, SP 07034-902, Brasil"
      );
    });

    it("should return the formatted address for a valid lowercase code", () => {
      const address = getAirportAddress("gru");
      expect(address).toBe(
        "Aeroporto Internacional de São Paulo/Guarulhos - Avenida Monteiro de Carvalho, 1000, Guarulhos, SP 07034-902, Brasil"
      );
    });

    it("should return the formatted address for another valid code (SDU)", () => {
      const address = getAirportAddress("SDU");
      expect(address).toBe(
        "Aeroporto Santos Dumont - Praça Senador Salgado Filho, s/n, Rio de Janeiro, RJ 20040-020, Brasil"
      );
    });

    it("should return the formatted address for another valid code (VCP)", () => {
      const address = getAirportAddress("VCP");
      expect(address).toBe(
        "Aeroporto de Campinas/Viracopos - Rodovia SP-332, km 72, Campinas, SP 13100-000, Brasil"
      );
    });

    it("should return the code itself for an unknown code", () => {
      expect(getAirportAddress("XYZ")).toBe("XYZ");
    });

    it("should return the code itself for an empty string", () => {
      expect(getAirportAddress("")).toBe("");
    });
  });

  describe("getAirportName", () => {
    it("should return the name for a valid uppercase code", () => {
      const name = getAirportName("NVT");
      expect(name).toBe("Aeroporto de Navegantes");
    });

    it("should return the name for a valid lowercase code", () => {
      const name = getAirportName("nvt");
      expect(name).toBe("Aeroporto de Navegantes");
    });

    it("should return the name for another valid code (BSB)", () => {
      const name = getAirportName("BSB");
      expect(name).toBe("Aeroporto Internacional de Brasília");
    });

    it("should return the name for another valid code (CWB)", () => {
      const name = getAirportName("CWB");
      expect(name).toBe("Aeroporto Internacional de Curitiba");
    });

    it("should return the code itself for an unknown code", () => {
      expect(getAirportName("ABC")).toBe("ABC");
    });

    it("should return the code itself for an empty string", () => {
      expect(getAirportName("")).toBe("");
    });

    it("should handle codes with leading or trailing whitespace", () => {
      expect(getAirportName(" GRU ")).toBe(
        "Aeroporto Internacional de São Paulo/Guarulhos"
      );
    });

    it("should handle null or undefined gracefully if passed as any", () => {
      expect(getAirportName(null as any)).toBe(null);
      expect(getAirportName(undefined as any)).toBe(undefined);
    });

    it("should return the name when code has mixed cases", () => {
      expect(getAirportName("gRu")).toBe(
        "Aeroporto Internacional de São Paulo/Guarulhos"
      );
    });
  });
});
