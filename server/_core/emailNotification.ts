import { Resend } from "resend";

/**
 * Email notification for ticket changes
 * Supports: creation, update, deletion of tickets
 * Uses Resend.com for sending emails
 */

export interface TicketChangeNotification {
  type: "created" | "updated" | "deleted";
  weekNumber: number;
  ticketType: "departure" | "return";
  changes?: {
    before?: Record<string, any>;
    after?: Record<string, any>;
  };
  timestamp: Date;
  // Complete ticket data for both departure and return
  departureFlightNumber?: string;
  departureFlightDatetime?: string;
  departureAirline?: string;
  departureLocator?: string;
  returnFlightNumber?: string;
  returnFlightDatetime?: string;
  returnAirline?: string;
  returnLocator?: string;
  departureDate?: string;
  returnDate?: string;
}

/**
 * Get Resend client instance
 */
function getResendClient(): Resend {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    throw new Error("RESEND_API_KEY not configured");
  }
  return new Resend(apiKey);
}

/**
 * Format ticket change details for email body
 */
function formatTicketDetails(notification: TicketChangeNotification): string {
  const {
    type,
    weekNumber,
    ticketType,
    changes,
    timestamp,
    departureFlightNumber,
    departureFlightDatetime,
    departureAirline,
    departureLocator,
    returnFlightNumber,
    returnFlightDatetime,
    returnAirline,
    returnLocator,
    departureDate,
    returnDate,
  } = notification;

  let html = `
    <div style="font-family: Arial, sans-serif; color: #333; max-width: 700px; margin: 0 auto;">
      <h2 style="color: #1e40af; border-bottom: 2px solid #1e40af; padding-bottom: 10px;">Notificação de Alteração de Bilhete</h2>
      
      <div style="background-color: #f8f9fa; padding: 15px; border-radius: 5px; margin: 15px 0;">
        <p><strong>Tipo de evento:</strong> ${
          type === "created"
            ? "✅ Bilhete Criado"
            : type === "updated"
              ? "✏️ Bilhete Alterado"
              : "❌ Bilhete Deletado"
        }</p>
        <p><strong>Semana:</strong> ${weekNumber}</p>
        <p><strong>Trecho:</strong> ${ticketType === "departure" ? "Ida" : "Volta"}</p>
        <p><strong>Data/Hora da Notificação:</strong> ${timestamp.toLocaleString("pt-BR")}</p>
      </div>
  `;

  // Show what was updated
  if (changes && type === "updated") {
    html += `
      <h3 style="color: #1e40af; margin-top: 20px; margin-bottom: 10px;">📝 O que foi atualizado</h3>
      <table style="width: 100%; border-collapse: collapse; margin-bottom: 20px;">
        <tr style="background-color: #e3f2fd;">
          <th style="border: 1px solid #90caf9; padding: 12px; text-align: left; font-weight: bold;">Campo</th>
          <th style="border: 1px solid #90caf9; padding: 12px; text-align: left; font-weight: bold;">Antes</th>
          <th style="border: 1px solid #90caf9; padding: 12px; text-align: left; font-weight: bold;">Depois</th>
        </tr>
    `;

    const allKeys = new Set([
      ...Object.keys(changes.before || {}),
      ...Object.keys(changes.after || {}),
    ]);

    for (const key of Array.from(allKeys)) {
      const before = changes.before?.[key] ?? "—";
      const after = changes.after?.[key] ?? "—";

      if (before !== after) {
        html += `
          <tr>
            <td style="border: 1px solid #90caf9; padding: 12px;"><strong>${key}</strong></td>
            <td style="border: 1px solid #90caf9; padding: 12px; color: #666;">${before}</td>
            <td style="border: 1px solid #90caf9; padding: 12px; background-color: #fff9c4; font-weight: bold;">${after}</td>
          </tr>
        `;
      }
    }

    html += `</table>`;
  }

  // Show complete ticket data
  html += `
    <h3 style="color: #1e40af; margin-top: 20px; margin-bottom: 10px;">✈️ Dados Completos do Bilhete</h3>
    <div style="background-color: #f5f5f5; padding: 15px; border-radius: 5px; margin-bottom: 20px;">
  `;

  // Departure flight info
  if (departureFlightNumber || departureAirline) {
    html += `
      <div style="margin-bottom: 15px; padding-bottom: 15px; border-bottom: 1px solid #ddd;">
        <h4 style="color: #0d47a1; margin: 0 0 10px 0;">🔵 Voo de Ida</h4>
        <p><strong>Data:</strong> ${departureDate || "—"}</p>
        <p><strong>Companhia Aérea:</strong> ${departureAirline || "—"}</p>
        <p><strong>Número do Voo:</strong> ${departureFlightNumber || "—"}</p>
        <p><strong>Data/Hora de Partida:</strong> ${departureFlightDatetime || "—"}</p>
        <p><strong>Localizador:</strong> <span style="font-family: monospace; background-color: #fff9c4; padding: 2px 6px; border-radius: 3px; font-weight: bold;">${departureLocator || "—"}</span></p>
      </div>
    `;
  }

  // Return flight info
  if (returnFlightNumber || returnAirline) {
    html += `
      <div>
        <h4 style="color: #0d47a1; margin: 0 0 10px 0;">🔴 Voo de Volta</h4>
        <p><strong>Data:</strong> ${returnDate || "—"}</p>
        <p><strong>Companhia Aérea:</strong> ${returnAirline || "—"}</p>
        <p><strong>Número do Voo:</strong> ${returnFlightNumber || "—"}</p>
        <p><strong>Data/Hora de Partida:</strong> ${returnFlightDatetime || "—"}</p>
        <p><strong>Localizador:</strong> <span style="font-family: monospace; background-color: #fff9c4; padding: 2px 6px; border-radius: 3px; font-weight: bold;">${returnLocator || "—"}</span></p>
      </div>
    `;
  }

  html += `
    </div>
    <hr style="margin: 20px 0; border: none; border-top: 1px solid #ddd;">
    <p style="font-size: 12px; color: #666; text-align: center;">
      Smart Fly — Planejador de Passagens Aéreas 2026<br>
      Esta é uma notificação automática. Não responda este e-mail.
    </p>
  </div>
  `;

  return html;
}

/**
 * Send email using Resend
 */
async function sendEmailViaResend(
  to: string[],
  subject: string,
  htmlContent: string
): Promise<boolean> {
  try {
    console.log(
      `[Email] Sending email to ${to.join(", ")} with subject: ${subject}`
    );

    const resend = getResendClient();

    const { data, error } = await resend.emails.send({
      from: "Smart Fly <noreply@tdmsistemas.com.br>",
      to: to,
      subject: subject,
      html: htmlContent,
    });

    if (error) {
      console.error("[Email] Resend API error:", error);
      return false;
    }

    console.log(`[Email] Email sent successfully via Resend. Id: ${data?.id}`);
    return true;
  } catch (error) {
    console.error("[Email] Failed to send email via Resend:", error);
    return false;
  }
}

/**
 * Send ticket change notification email to recipients
 */
export async function sendTicketNotificationEmail(
  recipients: string[],
  notification: TicketChangeNotification
): Promise<boolean> {
  if (!recipients || recipients.length === 0) {
    console.warn("[Email] No recipients provided for ticket notification");
    return false;
  }

  try {
    const subject = `[Bilhete ${notification.type === "created" ? "Criado" : notification.type === "updated" ? "Alterado" : "Deletado"}] Semana ${notification.weekNumber} - ${notification.ticketType === "departure" ? "Ida" : "Volta"}`;

    const htmlContent = formatTicketDetails(notification);

    return await sendEmailViaResend(recipients, subject, htmlContent);
  } catch (error) {
    console.error("[Email] Failed to send ticket notification:", error);
    return false;
  }
}

/**
 * Send ticket share notification email (for shareByEmail feature)
 */
export async function sendShareByEmailNotification(
  recipients: string[],
  subject: string,
  htmlContent: string
): Promise<boolean> {
  if (!recipients || recipients.length === 0) {
    console.warn("[Email] No recipients provided for share notification");
    return false;
  }

  try {
    return await sendEmailViaResend(recipients, subject, htmlContent);
  } catch (error) {
    console.error("[Email] Failed to send share notification:", error);
    return false;
  }
}

/**
 * Send a test email to verify Resend configuration
 */
export async function sendTestEmail(testEmail: string): Promise<boolean> {
  try {
    const subject = "✅ Teste de Configuração de E-mail — Smart Fly";
    const htmlContent = `
      <div style="font-family: Arial, sans-serif; color: #333; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #1e40af;">✅ Configuração de E-mail Funcionando</h2>
        <p>Este é um e-mail de teste para verificar se a integração com Resend está correta.</p>
        <p><strong>Data/Hora:</strong> ${new Date().toLocaleString("pt-BR")}</p>
        <hr style="margin: 20px 0; border: none; border-top: 1px solid #ddd;">
        <p style="margin-top: 20px; font-size: 12px; color: #666;">
          Smart Fly — Planejador de Passagens Aéreas 2026
        </p>
      </div>
    `;

    return await sendEmailViaResend([testEmail], subject, htmlContent);
  } catch (error) {
    console.error("[Email] Failed to send test email:", error);
    return false;
  }
}
