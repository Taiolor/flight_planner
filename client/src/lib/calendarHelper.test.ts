import { describe, it, expect } from "vitest";
import { buildFlightTrackUrl, buildWhatsAppShareUrl } from "./calendarHelper";

describe("buildFlightTrackUrl", () => {
  it("monta o link público do Flightradar24 para ida e volta", () => {
    expect(buildFlightTrackUrl("latam", "LA3045", "GRU", "NVT", "2024-05-15T10:00"))
      .toBe("https://www.flightradar24.com/data/flights/la3045");
    expect(buildFlightTrackUrl("gol", "1234", "NVT", "GRU", "2024-05-20T15:00"))
      .toBe("https://www.flightradar24.com/data/flights/g31234");
  });

  it("não monta link para número de voo ausente ou inválido", () => {
    expect(buildFlightTrackUrl("latam", "", "GRU", "NVT", "2024-05-15T10:00")).toBe("");
    expect(buildFlightTrackUrl("latam", "###", "GRU", "NVT", "2024-05-15T10:00")).toBe("");
  });
});

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
    expect(decodedText).toContain("LATAM AIRLINES • Voo LA3045");
    expect(decodedText).toContain("🔑 Localizador: *ABC123*");
    expect(decodedText).toContain(
      "🔍 Rastrear: https://www.flightradar24.com/data/flights/la3045"
    );

    expect(decodedText).toContain("🛬 *VOLTA — NVT → GRU*");
    expect(decodedText).toContain("20/05/2024 às 15:00");
    expect(decodedText).toContain("GOL LINHAS AÉREAS • Voo G31234");
    expect(decodedText).toContain("🔑 Localizador: *XYZ987*");
    expect(decodedText).toContain(
      "🔍 Rastrear: https://www.flightradar24.com/data/flights/g31234"
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
    expect(decodedText).toContain("LATAM AIRLINES • Voo LA3045");
    expect(decodedText).toContain("🔑 Localizador: *ABC123*");

    expect(decodedText).toContain("🛬 *VOLTA — NVT → GRU*");
    expect(decodedText.match(/🔍 Rastrear:/g)).toHaveLength(1); // Apenas a ida possui link
  });
});
