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
function formatTicketDetails(
  notification: TicketChangeNotification
): string {
  const { type, weekNumber, ticketType, changes, timestamp } = notification;

  let html = `
    <div style="font-family: Arial, sans-serif; color: #333;">
      <h2 style="color: #1e40af;">Notificação de Alteração de Bilhete</h2>
      
      <p><strong>Tipo de evento:</strong> ${
        type === "created"
          ? "✅ Bilhete Criado"
          : type === "updated"
            ? "✏️ Bilhete Alterado"
            : "❌ Bilhete Deletado"
      }</p>
      
      <p><strong>Semana:</strong> ${weekNumber}</p>
      <p><strong>Trecho:</strong> ${ticketType === "departure" ? "Ida" : "Volta"}</p>
      <p><strong>Data/Hora:</strong> ${timestamp.toLocaleString("pt-BR")}</p>
  `;

  if (changes && type === "updated") {
    html += `
      <h3 style="color: #1e40af; margin-top: 20px;">Detalhes da Alteração</h3>
      <table style="width: 100%; border-collapse: collapse; margin-top: 10px;">
        <tr style="background-color: #f0f0f0;">
          <th style="border: 1px solid #ddd; padding: 10px; text-align: left;">Campo</th>
          <th style="border: 1px solid #ddd; padding: 10px; text-align: left;">Antes</th>
          <th style="border: 1px solid #ddd; padding: 10px; text-align: left;">Depois</th>
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
            <td style="border: 1px solid #ddd; padding: 10px;"><strong>${key}</strong></td>
            <td style="border: 1px solid #ddd; padding: 10px;">${before}</td>
            <td style="border: 1px solid #ddd; padding: 10px; background-color: #fffacd;"><strong>${after}</strong></td>
          </tr>
        `;
      }
    }

    html += `</table>`;
  }

  html += `
      <hr style="margin: 20px 0; border: none; border-top: 1px solid #ddd;">
      <p style="font-size: 12px; color: #666;">
        Esta é uma notificação automática do Planejador de Passagens Aéreas 2026.
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
    console.log(`[Email] Sending email to ${to.join(", ")} with subject: ${subject}`);

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
