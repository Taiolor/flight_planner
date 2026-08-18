import { describe, expect, it } from "vitest";
import {
  formatTicketDetails,
  formatTicketShareEmail,
  sanitizeEmailSubject,
} from "./emailNotification";

describe("email notification sanitization", () => {
  it("escapes ticket fields and change values before inserting them into HTML", () => {
    const html = formatTicketDetails({
      type: "updated",
      eventLabel: '<img src=x onerror="alert(1)">',
      weekNumber: 12,
      ticketType: "departure",
      timestamp: new Date("2026-08-18T12:00:00.000Z"),
      departureAirline: "<b>Companhia</b>",
      departureFlightNumber: 'LA"123',
      departureLocator: "<script>alert(1)</script>",
      changes: {
        before: { locator: "<before>" },
        after: { locator: "<after>" },
      },
    });

    expect(html).not.toContain('<img src=x onerror="alert(1)">');
    expect(html).not.toContain("<script>alert(1)</script>");
    expect(html).toContain("&lt;img src=x onerror=&quot;alert(1)&quot;&gt;");
    expect(html).toContain("&lt;script&gt;alert(1)&lt;/script&gt;");
    expect(html).toContain("&lt;before&gt;");
    expect(html).toContain("&lt;after&gt;");
  });

  it("escapes shared-flight labels and rejects unsafe link protocols", () => {
    const html = formatTicketShareEmail({
      weekLabel: '<img src=x onerror="alert(1)">',
      departure: {
        date: "18/08/2026",
        time: "10:00",
        departureAirport: "<GRU>",
        arrivalAirport: "NVT",
        airline: "LATAM",
        flightNumber: "LA123",
        locator: "ABC123",
        outlookUrl: "javascript:alert(1)",
        googleUrl: "https://calendar.google.com/calendar/render?action=TEMPLATE",
      },
      return: {
        date: "22/08/2026",
        time: "18:00",
        departureAirport: "NVT",
        arrivalAirport: "GRU",
        airline: "LATAM",
        flightNumber: "LA456",
        locator: "DEF456",
        outlookUrl: "https://outlook.live.com/calendar/0/deeplink/compose",
        googleUrl: "https://calendar.google.com/calendar/render?action=TEMPLATE",
      },
    });

    expect(html).toContain("&lt;img src=x onerror=&quot;alert(1)&quot;&gt;");
    expect(html).toContain("&lt;GRU&gt;");
    expect(html).not.toContain("href=\"javascript:alert(1)\"");
    expect(html).toContain('href="#"');
  });

  it("prevents line breaks from becoming e-mail subject header injection", () => {
    expect(sanitizeEmailSubject("Atualização\r\nBcc: attacker@example.com")).toBe(
      "Atualização Bcc: attacker@example.com"
    );
  });
});
