import { execSync } from "child_process";

/**
 * Email notification for ticket changes
 * Supports: creation, update, deletion of tickets
 * Uses Gmail MCP integration for sending emails
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
 * Send email using Gmail MCP integration
 */
async function sendEmailViaGmail(
  to: string[],
  subject: string,
  htmlContent: string
): Promise<boolean> {
  try {
    // Convert HTML to plain text by removing tags and decoding entities
    const plainText = htmlContent
      .replace(/<[^>]*>/g, '') // Remove HTML tags
      .replace(/&nbsp;/g, ' ') // Replace non-breaking spaces
      .replace(/&lt;/g, '<') // Decode entities
      .replace(/&gt;/g, '>')
      .replace(/&amp;/g, '&')
      .replace(/\n\s+/g, '\n') // Remove extra whitespace
      .trim();

    // Prepare message for Gmail MCP
    const message = {
      to: to,
      subject: subject,
      content: plainText || htmlContent, // Use plain text, fallback to HTML if empty
    };

    // Call Gmail MCP tool via CLI
    const messagePayload = {
      messages: [message],
      save_as_draft: false,
    };

    const inputJson = JSON.stringify(messagePayload);

    console.log(`[Email] Sending email to ${to.join(', ')} with subject: ${subject}`);
    console.log(`[Email] Payload: ${inputJson}`);
    
    const result = execSync(
      `manus-mcp-cli tool call gmail_send_messages --server gmail --input '${inputJson}'`,
      { encoding: "utf-8" }
    );

    console.log(
      `[Email] Ticket notification sent successfully via Gmail. Result:`,
      result
    );
    return true;
  } catch (error) {
    console.error("[Email] Failed to send email via Gmail:", error);
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
    const textContent = `Notificação de alteração de bilhete - Semana ${notification.weekNumber} (${notification.ticketType === "departure" ? "Ida" : "Volta"})`;

    return await sendEmailViaGmail(recipients, subject, htmlContent);
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
    return await sendEmailViaGmail(recipients, subject, htmlContent);
  } catch (error) {
    console.error("[Email] Failed to send share notification:", error);
    return false;
  }
}

/**
 * Send a test email to verify Gmail configuration
 */
export async function sendTestEmail(testEmail: string): Promise<boolean> {
  try {
    const subject = "Teste de Configuração de E-mail";
    const htmlContent = `
      <div style="font-family: Arial, sans-serif; color: #333;">
        <h2 style="color: #1e40af;">✅ Configuração de E-mail Funcionando</h2>
        <p>Este é um e-mail de teste para verificar se a integração com Gmail está correta.</p>
        <p><strong>Data/Hora:</strong> ${new Date().toLocaleString("pt-BR")}</p>
        <p style="margin-top: 20px; font-size: 12px; color: #666;">
          Planejador de Passagens Aéreas 2026
        </p>
      </div>
    `;
    const textContent =
      "E-mail de teste - Configuração Gmail funcionando corretamente";

    return await sendEmailViaGmail(
      [testEmail],
      subject,
      htmlContent
    );
  } catch (error) {
    console.error("[Email] Failed to send test email:", error);
    return false;
  }
}
