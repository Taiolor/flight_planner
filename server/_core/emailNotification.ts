import { spawnSync } from "child_process";

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
export async function sendEmailViaGmail(
  to: string[],
  subject: string,
  htmlContent: string
): Promise<{ success: boolean; error?: string }> {
  try {
    // Prepare message for Gmail MCP
    const message = {
      to: to,
      subject: subject,
      content: htmlContent,
    };

    // Call Gmail MCP tool via CLI using spawnSync to avoid shell escaping issues
    const messagePayload = {
      messages: [message],
      save_as_draft: false,
    };

    const inputJson = JSON.stringify(messagePayload);

    const result = spawnSync("manus-mcp-cli", [
      "tool",
      "call",
      "gmail_send_messages",
      "--server",
      "gmail",
      "--input",
      inputJson,
    ]);

    if (result.error) {
      console.error("[Email] spawnSync error:", result.error);
      return {
        success: false,
        error: `Erro ao executar comando: ${result.error.message}`,
      };
    }

    if (result.status !== 0) {
      const stderr = result.stderr?.toString() || "Erro desconhecido";
      const stdout = result.stdout?.toString() || "";
      console.error("[Email] Gmail MCP error:", stderr, stdout);
      return {
        success: false,
        error: `Gmail MCP falhou: ${stderr || stdout}`,
      };
    }

    const output = result.stdout?.toString() || "";
    console.log("[Email] Email sent successfully via Gmail:", output);
    return { success: true };
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : String(error);
    console.error("[Email] Failed to send email via Gmail:", errorMsg);
    return {
      success: false,
      error: `Exceção ao enviar e-mail: ${errorMsg}`,
    };
  }
}

/**
 * Send ticket change notification email to recipients
 */
export async function sendTicketNotificationEmail(
  recipients: string[],
  notification: TicketChangeNotification
): Promise<{ success: boolean; error?: string }> {
  if (!recipients || recipients.length === 0) {
    console.warn("[Email] No recipients provided for ticket notification");
    return {
      success: false,
      error: "Nenhum destinatário fornecido",
    };
  }

  try {
    const subject = `[Bilhete ${notification.type === "created" ? "Criado" : notification.type === "updated" ? "Alterado" : "Deletado"}] Semana ${notification.weekNumber} - ${notification.ticketType === "departure" ? "Ida" : "Volta"}`;

    const htmlContent = formatTicketDetails(notification);

    return await sendEmailViaGmail(recipients, subject, htmlContent);
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : String(error);
    console.error("[Email] Failed to send ticket notification:", errorMsg);
    return {
      success: false,
      error: `Falha ao enviar notificação: ${errorMsg}`,
    };
  }
}

/**
 * Send a test email to verify Gmail configuration
 */
export async function sendTestEmail(testEmail: string): Promise<{
  success: boolean;
  error?: string;
}> {
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

    return await sendEmailViaGmail([testEmail], subject, htmlContent);
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : String(error);
    console.error("[Email] Failed to send test email:", errorMsg);
    return {
      success: false,
      error: `Falha ao enviar e-mail de teste: ${errorMsg}`,
    };
  }
}
