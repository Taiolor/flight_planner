import { describe, it, expect } from "vitest";
import { buildWhatsAppShareUrl } from "./calendarHelper";

describe("buildWhatsAppShareUrl", () => {
  it("generates a complete WhatsApp share URL with all fields provided", () => {
    const url = buildWhatsAppShareUrl({
      weekLabel: "Semana de 15/05",
      departureDate: "2024-05-15",
      departureTime: "10:00",
      departureAirport: "GRU",
      departureAirline: "LATAM",
      departureFlightNumber: "LA3045",
      departureLocator: "ABC123",
      returnDate: "2024-05-20",
      returnTime: "15:00",
      returnAirport: "NVT",
      returnAirline: "GOL",
      returnFlightNumber: "G31234",
      returnLocator: "XYZ987",
    });

    expect(url).toContain("https://wa.me/?text=");

    const decodedText = decodeURIComponent(
      url.replace("https://wa.me/?text=", "")
    );
    expect(decodedText).toContain("✈️ *Smart Fly — Passagem Confirmada!*");
    expect(decodedText).toContain("📅 *Semana de 15/05*");

    expect(decodedText).toContain("🛫 *IDA — GRU → NVT*");
    expect(decodedText).toContain("15/05/2024 às 10:00");
    expect(decodedText).toContain("LATAM Airlines • Voo LA3045");
    expect(decodedText).toContain("🔑 Localizador: *ABC123*");
    expect(decodedText).toContain(
      "🔍 Rastrear: https://www.google.com/search?q=LA+flight+3045+from+GRU+to+NVT,+2024-05-15"
    );

    expect(decodedText).toContain("🛬 *VOLTA — NVT → GRU*");
    expect(decodedText).toContain("20/05/2024 às 15:00");
    expect(decodedText).toContain("Gol Linhas Aéreas • Voo G31234");
    expect(decodedText).toContain("🔑 Localizador: *XYZ987*");
    expect(decodedText).toContain(
      "🔍 Rastrear: https://www.google.com/search?q=G3+flight+1234+from+NVT+to+GRU,+2024-05-20"
    );
  });

  it("generates a valid URL when some optional fields are missing", () => {
    const url = buildWhatsAppShareUrl({
      weekLabel: "Semana sem voos",
      departureDate: "",
      departureTime: "",
      departureAirport: "",
      departureAirline: "",
      departureFlightNumber: "",
      departureLocator: "",
      returnDate: "",
      returnTime: "",
      returnAirport: "",
      returnAirline: "",
      returnFlightNumber: "",
      returnLocator: "",
    });

    const decodedText = decodeURIComponent(
      url.replace("https://wa.me/?text=", "")
    );
    expect(decodedText).toContain("✈️ *Smart Fly — Passagem Confirmada!*");
    expect(decodedText).toContain("🛫 *IDA — GRU → NVT*"); // Defaults to GRU -> NVT
    expect(decodedText).toContain("🛬 *VOLTA — NVT → GRU*"); // Defaults to NVT -> GRU
    expect(decodedText).not.toContain("🔍 Rastrear"); // No track URL generated
    expect(decodedText).not.toContain("🔑 Localizador:"); // No locator generated
  });

  it("handles missing return details gracefully", () => {
    const url = buildWhatsAppShareUrl({
      weekLabel: "Somente Ida",
      departureDate: "2024-05-15",
      departureTime: "10:00",
      departureAirport: "GRU",
      departureAirline: "LATAM",
      departureFlightNumber: "LA3045",
      departureLocator: "ABC123",
      returnDate: "",
      returnTime: "",
      returnAirport: "",
      returnAirline: "",
      returnFlightNumber: "",
      returnLocator: "",
    });

    const decodedText = decodeURIComponent(
      url.replace("https://wa.me/?text=", "")
    );
    expect(decodedText).toContain("🛫 *IDA — GRU → NVT*");
    expect(decodedText).toContain("15/05/2024 às 10:00");
    expect(decodedText).toContain("LATAM Airlines • Voo LA3045");
    expect(decodedText).toContain("🔑 Localizador: *ABC123*");

    expect(decodedText).toContain("🛬 *VOLTA — NVT → GRU*");
    expect(decodedText).not.toContain(
      "🔍 Rastrear: https://www.google.com/search?q=from+NVT+to+GRU"
    ); // No track URL for return flight
  });
});
