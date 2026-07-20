import { describe, it, expect } from "vitest";
import { getAirportAddress, getAirportName } from "./airportAddresses";

describe("airportAddresses", () => {
  describe("getAirportAddress", () => {
    it("should return the formatted address for a valid uppercase code", () => {
      const address = getAirportAddress("GRU");
      expect(address).toBe("Aeroporto Internacional de São Paulo/Guarulhos - Avenida Monteiro de Carvalho, 1000, Guarulhos, SP 07034-902, Brasil");
    });

    it("should return the formatted address for a valid lowercase code", () => {
      const address = getAirportAddress("gru");
      expect(address).toBe("Aeroporto Internacional de São Paulo/Guarulhos - Avenida Monteiro de Carvalho, 1000, Guarulhos, SP 07034-902, Brasil");
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

    it("should return the code itself for an unknown code", () => {
      expect(getAirportName("ABC")).toBe("ABC");
    });

    it("should return the code itself for an empty string", () => {
      expect(getAirportName("")).toBe("");
    });
  });
});
