import { Resend } from "resend";
import { ENV } from "./env";

/**
 * Email notification for ticket changes
 * Supports: creation, update, deletion of tickets
 * Uses Resend.com for sending emails
 */

export interface TicketChangeNotification {
  type: "created" | "updated" | "deleted";
  eventLabel?: string;
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

export function escapeHtml(value: unknown): string {
  return String(value ?? "").replace(/[&<>"']/g, character => {
    const entities: Record<string, string> = {
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      '"': "&quot;",
      "'": "&#39;",
    };
    return entities[character];
  });
}

function formatEmailValue(value: unknown, fallback = "—"): string {
  const normalized = value === undefined || value === null || value === "" ? fallback : value;
  return escapeHtml(normalized);
}

export function sanitizeEmailSubject(subject: string): string {
  return subject.replace(/[\r\n]+/g, " ").replace(/\s+/g, " ").trim().slice(0, 180);
}

function safeEmailHref(value: string | undefined): string {
  if (!value) return "#";
  try {
    const url = new URL(value);
    if (url.protocol !== "https:" && url.protocol !== "http:") return "#";
    return escapeHtml(url.toString());
  } catch {
    return "#";
  }
}

export interface TicketShareEmailInput {
  weekLabel: string;
  departure: {
    date: string;
    time: string;
    departureAirport: string;
    arrivalAirport: string;
    airline: string;
    flightNumber: string;
    locator: string;
    terminal?: string | null;
    outlookUrl: string;
    googleUrl: string;
    trackingUrl?: string | null;
  };
  return: {
    date: string;
    time: string;
    departureAirport: string;
    arrivalAirport: string;
    airline: string;
    flightNumber: string;
    locator: string;
    terminal?: string | null;
    outlookUrl: string;
    googleUrl: string;
    trackingUrl?: string | null;
  };
}

function formatTicketShareLeg(
  title: string,
  leg: TicketShareEmailInput["departure"]
): string {
  const terminal = leg.terminal
    ? `<p style="margin: 8px 0;"><strong>Terminal:</strong> ${formatEmailValue(leg.terminal)}</p>`
    : "";
  const trackingLink = leg.trackingUrl
    ? `<a href="${safeEmailHref(leg.trackingUrl)}" style="color: #059669; margin-right: 10px; text-decoration: none;">🔍 Rastrear</a>`
    : "";

  return `
    <div style="background-color: #f3f4f6; border-radius: 8px; padding: 16px; margin-bottom: 20px;">
      <h3 style="color: #1f2937; margin-top: 0;">${title}</h3>
      <p style="margin: 8px 0;"><strong>Data:</strong> ${formatEmailValue(leg.date)} às ${formatEmailValue(leg.time)}</p>
      <p style="margin: 8px 0;"><strong>Rota:</strong> ${formatEmailValue(leg.departureAirport)} → ${formatEmailValue(leg.arrivalAirport)}</p>
      <p style="margin: 8px 0;"><strong>Companhia:</strong> ${formatEmailValue(leg.airline)} ${formatEmailValue(leg.flightNumber)}</p>
      ${terminal}
      <p style="margin: 8px 0;"><strong>Localizador:</strong> <code style="background-color: #e5e7eb; padding: 2px 6px; border-radius: 3px;">${formatEmailValue(leg.locator)}</code></p>
      <p style="margin: 8px 0;">
        <a href="${safeEmailHref(leg.outlookUrl)}" style="color: #0078d4; margin-right: 10px; text-decoration: none;">📅 Outlook</a>
        <a href="${safeEmailHref(leg.googleUrl)}" style="color: #1f2937; margin-right: 10px; text-decoration: none;">📅 Google</a>
        ${trackingLink}
      </p>
    </div>
  `;
}

export function formatTicketShareEmail(input: TicketShareEmailInput): string {
  return `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2 style="color: #1f2937; margin-bottom: 20px;">Compartilhamento de Bilhetes ✈️</h2>
      <p style="color: #4b5563; margin-bottom: 20px;"><strong>${formatEmailValue(input.weekLabel)}</strong></p>
      ${formatTicketShareLeg("Voo de Ida 🛫", input.departure)}
      ${formatTicketShareLeg("Voo de Volta 🛬", input.return)}
      <p style="color: #6b7280; font-size: 12px; margin-top: 30px; border-top: 1px solid #e5e7eb; padding-top: 20px;">
        Compartilhado via Smart Fly - Planejador de Passagens Aéreas 2026
      </p>
    </div>
  `;
}

/**
 * Get Resend client instance
 */
function getResendClient(): Resend {
  const apiKey = ENV.resendApiKey;
  if (!apiKey) {
    throw new Error("RESEND_API_KEY not configured");
  }
  return new Resend(apiKey);
}

/**
 * Format ticket change details for email body
 */
export function formatTicketDetails(notification: TicketChangeNotification): string {
  const {
    type,
    eventLabel,
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
        <p><strong>Tipo de evento:</strong> ${formatEmailValue(eventLabel ?? (type === "created"
            ? "✅ Bilhete Criado"
            : type === "updated"
              ? "✏️ Bilhete Alterado"
              : "❌ Bilhete Deletado"))}</p>
        <p><strong>Semana:</strong> ${formatEmailValue(weekNumber)}</p>
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
            <td style="border: 1px solid #90caf9; padding: 12px;"><strong>${formatEmailValue(key)}</strong></td>
            <td style="border: 1px solid #90caf9; padding: 12px; color: #666;">${formatEmailValue(before)}</td>
            <td style="border: 1px solid #90caf9; padding: 12px; background-color: #fff9c4; font-weight: bold;">${formatEmailValue(after)}</td>
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
        <p><strong>Data:</strong> ${formatEmailValue(departureDate)}</p>
        <p><strong>Companhia Aérea:</strong> ${formatEmailValue(departureAirline)}</p>
        <p><strong>Número do Voo:</strong> ${formatEmailValue(departureFlightNumber)}</p>
        <p><strong>Data/Hora de Partida:</strong> ${formatEmailValue(departureFlightDatetime)}</p>
        <p><strong>Localizador:</strong> <span style="font-family: monospace; background-color: #fff9c4; padding: 2px 6px; border-radius: 3px; font-weight: bold;">${formatEmailValue(departureLocator)}</span></p>
      </div>
    `;
  }

  // Return flight info
  if (returnFlightNumber || returnAirline) {
    html += `
      <div>
        <h4 style="color: #0d47a1; margin: 0 0 10px 0;">🔴 Voo de Volta</h4>
        <p><strong>Data:</strong> ${formatEmailValue(returnDate)}</p>
        <p><strong>Companhia Aérea:</strong> ${formatEmailValue(returnAirline)}</p>
        <p><strong>Número do Voo:</strong> ${formatEmailValue(returnFlightNumber)}</p>
        <p><strong>Data/Hora de Partida:</strong> ${formatEmailValue(returnFlightDatetime)}</p>
        <p><strong>Localizador:</strong> <span style="font-family: monospace; background-color: #fff9c4; padding: 2px 6px; border-radius: 3px; font-weight: bold;">${formatEmailValue(returnLocator)}</span></p>
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
    const resend = getResendClient();

    const { data, error } = await resend.emails.send({
      from: "Smart Fly <noreply@tdmsistemas.com.br>",
      to: to,
      subject: sanitizeEmailSubject(subject),
      html: htmlContent,
    });

    if (error) {
      console.error("[Email] Resend API error:", error);
      return false;
    }

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
    const eventLabel = notification.eventLabel ?? (notification.type === "created" ? "Criado" : notification.type === "updated" ? "Alterado" : "Deletado");
    const subject = `[Bilhete ${eventLabel}] Semana ${notification.weekNumber} - ${notification.ticketType === "departure" ? "Ida" : "Volta"}`;

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

export type GeminiBudgetAlertEmailInput = {
  thresholdPercent: number;
  yearMonth: string;
  estimatedCostMicrocents: number;
  monthlyBudgetCents: number;
  usagePercent: number;
};

export async function sendGeminiBudgetAlertEmail(
  recipient: string,
  input: GeminiBudgetAlertEmailInput
): Promise<boolean> {
  if (!recipient.trim()) return false;
  const currency = new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  });
  const estimated = currency.format(input.estimatedCostMicrocents / 100_000_000);
  const budget = currency.format(input.monthlyBudgetCents / 100);
  const htmlContent = `
    <div style="font-family: Arial, sans-serif; color: #1f2937; max-width: 640px; margin: 0 auto;">
      <h2 style="color: #1d4ed8;">Alerta de orçamento do Fly.IA</h2>
      <p>O consumo estimado do Gemini atingiu <strong>${formatEmailValue(input.thresholdPercent)}%</strong> do orçamento configurado.</p>
      <div style="background: #eff6ff; border-radius: 8px; padding: 16px; margin: 18px 0;">
        <p style="margin: 6px 0;"><strong>Ciclo:</strong> ${formatEmailValue(input.yearMonth)}</p>
        <p style="margin: 6px 0;"><strong>Estimativa:</strong> ${formatEmailValue(estimated)}</p>
        <p style="margin: 6px 0;"><strong>Orçamento interno:</strong> ${formatEmailValue(budget)}</p>
        <p style="margin: 6px 0;"><strong>Uso calculado:</strong> ${formatEmailValue(input.usagePercent)}%</p>
      </div>
      <p>Revise o painel administrativo do SmartFly e o saldo oficial no Google AI Studio. Esta é uma estimativa baseada nos tokens registrados pela aplicação.</p>
    </div>
  `;
  return sendEmailViaResend(
    [recipient],
    `[Fly.IA] ${input.thresholdPercent}% do orçamento atingido`,
    htmlContent
  );
}
