import { describe, it, expect } from "vitest";
import { generateBookingLink } from "./flightData";

/**
 * Unit tests for generateBookingLink.
 * Note: The implementation in flightData.ts differs from the snippet provided in the task description.
 * These tests are based on the actual code present in flightData.ts.
 */
describe("generateBookingLink", () => {
  it("generates correct link for Kayak", () => {
    const link = generateBookingLink(
      "kayak",
      "01/03/2026",
      "06/03/2026",
      "01/03/2026",
      "06/03/2026",
      "GRU",
      "NVT"
    );
    expect(link).toBe("https://www.kayak.com.br/flights/GRU-NVT/2026-03-01/2026-03-06?ucs=p1nu6v&sort=bestflight_a");
  });

  it("generates correct link for LATAM", () => {
    const link = generateBookingLink(
      "latam",
      "01/03/2026",
      "06/03/2026",
      "01/03/2026",
      "06/03/2026",
      "GRU",
      "NVT"
    );
    expect(link).toBe("https://www.latam.com/pt_br/?origin=GRU&destination=NVT&outbound=01MAR26&inbound=06MAR26&adults=1&cabin=economy");
  });

  it("generates correct link for Gol", () => {
    const link = generateBookingLink(
      "gol",
      "10/05/2026",
      "15/05/2026",
      "10/05/2026",
      "15/05/2026",
      "GRU",
      "NVT"
    );
    expect(link).toBe("https://www.voegol.com.br/?origin=GRU&destination=NVT&outbound=10MAY26&inbound=15MAY26&adults=1&cabin=economy");
  });

  it("falls back to LATAM for unknown airline", () => {
    const link = generateBookingLink(
      "unknown",
      "01/01/2026",
      "05/01/2026",
      "01/01/2026",
      "05/01/2026",
      "GRU",
      "NVT"
    );
    expect(link).toContain("https://www.latam.com/pt_br/");
  });

  it("includes airport=CGH parameter when origin is CGH", () => {
    const link = generateBookingLink(
      "azul",
      "01/03/2026",
      "06/03/2026",
      "01/03/2026",
      "06/03/2026",
      "CGH",
      "NVT"
    );
    expect(link).toContain("&airport=CGH");
    expect(link).toContain("origin=CGH");
  });

  it("does not include airport parameter when origin is GRU", () => {
    const link = generateBookingLink(
      "azul",
      "01/03/2026",
      "06/03/2026",
      "01/03/2026",
      "06/03/2026",
      "GRU",
      "NVT"
    );
    expect(link).not.toContain("&airport=CGH");
    expect(link).toContain("origin=GRU");
  });

  it("correctly formats months for non-Kayak airlines", () => {
    const months = [
      { num: "01", expected: "JAN" },
      { num: "02", expected: "FEB" },
      { num: "03", expected: "MAR" },
      { num: "04", expected: "APR" },
      { num: "05", expected: "MAY" },
      { num: "06", expected: "JUN" },
      { num: "07", expected: "JUL" },
      { num: "08", expected: "AUG" },
      { num: "09", expected: "SEP" },
      { num: "10", expected: "OCT" },
      { num: "11", expected: "NOV" },
      { num: "12", expected: "DEC" },
    ];

    months.forEach(({ num, expected }) => {
      const link = generateBookingLink(
        "latam",
        `01/${num}/2026`,
        `05/${num}/2026`,
        `01/${num}/2026`,
        `05/${num}/2026`,
        "GRU",
        "NVT"
      );
      expect(link).toContain(`outbound=01${expected}26`);
      expect(link).toContain(`inbound=05${expected}26`);
    });
  });
});
