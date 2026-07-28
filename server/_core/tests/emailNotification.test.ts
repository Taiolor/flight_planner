import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import {
  sendTicketNotificationEmail,
  sendShareByEmailNotification,
  sendTestEmail,
  TicketChangeNotification,
} from "../emailNotification";

// We need to access the mocked send function to verify its calls
const mockSend = vi
  .fn()
  .mockResolvedValue({ data: { id: "test-id" }, error: null });

vi.mock("resend", () => {
  return {
    Resend: class {
      emails = { send: mockSend };
    },
  };
});

describe("emailNotification", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.stubEnv("RESEND_API_KEY", "re_test_api_key");
  });

  afterEach(() => {
    vi.unstubAllEnvs();
  });

  describe("sendTicketNotificationEmail", () => {
    it("should return false if no recipients are provided", async () => {
      const notification: TicketChangeNotification = {
        type: "created",
        weekNumber: 1,
        ticketType: "departure",
        timestamp: new Date("2024-01-01T10:00:00Z"),
      };

      const result = await sendTicketNotificationEmail([], notification);

      expect(result).toBe(false);
      expect(mockSend).not.toHaveBeenCalled();
    });

    it("should return false if recipients array is undefined or null", async () => {
      const notification: TicketChangeNotification = {
        type: "created",
        weekNumber: 1,
        ticketType: "departure",
        timestamp: new Date("2024-01-01T10:00:00Z"),
      };

      const result1 = await sendTicketNotificationEmail(
        null as any,
        notification
      );
      expect(result1).toBe(false);

      const result2 = await sendTicketNotificationEmail(
        undefined as any,
        notification
      );
      expect(result2).toBe(false);

      expect(mockSend).not.toHaveBeenCalled();
    });

    it("should send an email with correct subject and formatted html for a created ticket", async () => {
      const notification: TicketChangeNotification = {
        type: "created",
        weekNumber: 5,
        ticketType: "return",
        timestamp: new Date("2024-01-01T10:00:00Z"),
      };

      const result = await sendTicketNotificationEmail(
        ["test@example.com"],
        notification
      );

      expect(result).toBe(true);
      expect(mockSend).toHaveBeenCalledTimes(1);

      const sendArgs = mockSend.mock.calls[0][0];
      expect(sendArgs.to).toEqual(["test@example.com"]);
      expect(sendArgs.subject).toBe("[Bilhete Criado] Semana 5 - Volta");
      expect(sendArgs.html).toContain("Bilhete Criado");
      expect(sendArgs.html).toContain("Semana:</strong> 5");
      expect(sendArgs.html).toContain("Trecho:</strong> Volta");
    });

    it("should send an email with correct subject and changes details for an updated ticket", async () => {
      const notification: TicketChangeNotification = {
        type: "updated",
        weekNumber: 2,
        ticketType: "departure",
        timestamp: new Date("2024-01-01T10:00:00Z"),
        changes: {
          before: { flightNumber: "LA123", status: "scheduled" },
          after: { flightNumber: "LA456", status: "scheduled" }, // Only flightNumber changed
        },
      };

      const result = await sendTicketNotificationEmail(
        ["user1@test.com", "user2@test.com"],
        notification
      );

      expect(result).toBe(true);
      expect(mockSend).toHaveBeenCalledTimes(1);

      const sendArgs = mockSend.mock.calls[0][0];
      expect(sendArgs.to).toEqual(["user1@test.com", "user2@test.com"]);
      expect(sendArgs.subject).toBe("[Bilhete Alterado] Semana 2 - Ida");

      // Check HTML content
      expect(sendArgs.html).toContain("Bilhete Alterado");
      expect(sendArgs.html).toContain("O que foi atualizado");
      expect(sendArgs.html).toContain("flightNumber");
      expect(sendArgs.html).toContain("LA123");
      expect(sendArgs.html).toContain("LA456");
    });

    it("should return false if resend API returns an error", async () => {
      mockSend.mockResolvedValueOnce({
        data: null,
        error: new Error("Resend failed"),
      });

      const notification: TicketChangeNotification = {
        type: "deleted",
        weekNumber: 3,
        ticketType: "departure",
        timestamp: new Date("2024-01-01T10:00:00Z"),
      };

      const result = await sendTicketNotificationEmail(
        ["test@example.com"],
        notification
      );

      expect(result).toBe(false);
      expect(mockSend).toHaveBeenCalledTimes(1);
    });

    it("should return false and log error if getResendClient throws (e.g. no API key)", async () => {
      vi.stubEnv("RESEND_API_KEY", "");

      const notification: TicketChangeNotification = {
        type: "created",
        weekNumber: 1,
        ticketType: "departure",
        timestamp: new Date("2024-01-01T10:00:00Z"),
      };

      const result = await sendTicketNotificationEmail(
        ["test@example.com"],
        notification
      );

      expect(result).toBe(false);
      expect(mockSend).not.toHaveBeenCalled();
    });

    it("should catch errors thrown during formatting (e.g. invalid notification object)", async () => {
      // Intentionally pass an invalid notification to cause a TypeError in formatTicketDetails
      const result = await sendTicketNotificationEmail(
        ["test@example.com"],
        null as any
      );

      expect(result).toBe(false);
      expect(mockSend).not.toHaveBeenCalled();
    });
  });

  describe("sendShareByEmailNotification", () => {
    it("should return false if no recipients are provided", async () => {
      const result = await sendShareByEmailNotification(
        [],
        "Test Subject",
        "<p>Test</p>"
      );

      expect(result).toBe(false);
      expect(mockSend).not.toHaveBeenCalled();
    });

    it("should send a share notification email", async () => {
      const result = await sendShareByEmailNotification(
        ["friend@test.com"],
        "Share Subject",
        "<h1>Hello</h1>"
      );

      expect(result).toBe(true);
      expect(mockSend).toHaveBeenCalledTimes(1);

      const sendArgs = mockSend.mock.calls[0][0];
      expect(sendArgs.to).toEqual(["friend@test.com"]);
      expect(sendArgs.subject).toBe("Share Subject");
      expect(sendArgs.html).toBe("<h1>Hello</h1>");
    });

    it("should return false if getResendClient throws", async () => {
      vi.stubEnv("RESEND_API_KEY", "");
      const result = await sendShareByEmailNotification(
        ["test@example.com"],
        "Share Subject",
        "<h1>Hello</h1>"
      );
      expect(result).toBe(false);
    });
  });

  describe("sendTestEmail", () => {
    it("should send a test email to the provided address", async () => {
      const result = await sendTestEmail("admin@test.com");

      expect(result).toBe(true);
      expect(mockSend).toHaveBeenCalledTimes(1);

      const sendArgs = mockSend.mock.calls[0][0];
      expect(sendArgs.to).toEqual(["admin@test.com"]);
      expect(sendArgs.subject).toBe(
        "✅ Teste de Configuração de E-mail — Smart Fly"
      );
      expect(sendArgs.html).toContain("Configuração de E-mail Funcionando");
    });

    it("should return false if getResendClient throws", async () => {
      vi.stubEnv("RESEND_API_KEY", "");
      const result = await sendTestEmail("admin@test.com");
      expect(result).toBe(false);
    });
  });
});
