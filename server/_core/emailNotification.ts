import nodemailer from "nodemailer";

/**
 * Email notification for ticket changes
 * Supports: creation, update, deletion of tickets
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
 * Create a transporter for sending emails
 * Uses environment variables for SMTP configuration
 */
function getTransporter() {
  // For development/testing, use a mock transporter
  // In production, configure SMTP credentials via environment variables
  const smtpHost = process.env.SMTP_HOST || "localhost";
  const smtpPort = parseInt(process.env.SMTP_PORT || "587");
  const smtpUser = process.env.SMTP_USER || "";
  const smtpPass = process.env.SMTP_PASS || "";
  const smtpFrom = process.env.SMTP_FROM || "noreply@flightplanner.local";

  return nodemailer.createTransport({
    host: smtpHost,
    port: smtpPort,
    secure: smtpPort === 465, // true for 465, false for other ports
    auth:
      smtpUser && smtpPass
        ? {
            user: smtpUser,
            pass: smtpPass,
          }
        : undefined,
    from: smtpFrom,
  });
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

    for (const key of allKeys) {
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
    const transporter = getTransporter();

    const subject = `[Bilhete ${notification.type === "created" ? "Criado" : notification.type === "updated" ? "Alterado" : "Deletado"}] Semana ${notification.weekNumber} - ${notification.ticketType === "departure" ? "Ida" : "Volta"}`;

    const htmlContent = formatTicketDetails(notification);

    const mailOptions = {
      to: recipients.join(", "),
      subject,
      html: htmlContent,
      text: `Notificação de alteração de bilhete - Semana ${notification.weekNumber} (${notification.ticketType === "departure" ? "Ida" : "Volta"})`,
    };

    const info = await transporter.sendMail(mailOptions);

    console.log(
      `[Email] Ticket notification sent successfully. Message ID: ${info.messageId}`
    );
    return true;
  } catch (error) {
    console.error("[Email] Failed to send ticket notification:", error);
    return false;
  }
}

/**
 * Send a test email to verify SMTP configuration
 */
export async function sendTestEmail(testEmail: string): Promise<boolean> {
  try {
    const transporter = getTransporter();

    const mailOptions = {
      to: testEmail,
      subject: "Teste de Configuração de E-mail",
      html: `
        <div style="font-family: Arial, sans-serif; color: #333;">
          <h2 style="color: #1e40af;">✅ Configuração de E-mail Funcionando</h2>
          <p>Este é um e-mail de teste para verificar se a configuração SMTP está correta.</p>
          <p><strong>Data/Hora:</strong> ${new Date().toLocaleString("pt-BR")}</p>
        </div>
      `,
      text: "E-mail de teste - Configuração SMTP funcionando corretamente",
    };

    const info = await transporter.sendMail(mailOptions);

    console.log(
      `[Email] Test email sent successfully. Message ID: ${info.messageId}`
    );
    return true;
  } catch (error) {
    console.error("[Email] Failed to send test email:", error);
    return false;
  }
}
