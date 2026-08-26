export type DecisionWeek = {
  weekNumber: number;
  departureDate: string;
  returnDate: string;
  isDeleted: number;
  isTicketIssued: number;
  departureAirline?: string | null;
  returnAirline?: string | null;
  departureAirport?: string | null;
  returnAirport?: string | null;
  departureRescheduled?: number;
  returnRescheduled?: number;
  departureCancelled?: number;
  returnCancelled?: number;
};

export type DecisionSeverity = "critical" | "warning" | "info";
export type DecisionDestination = "management" | "calendar";

export type DecisionItem = {
  id: string;
  severity: DecisionSeverity;
  destination: DecisionDestination;
  weekNumber: number;
  title: string;
  reason: string;
  actionLabel: string;
  score: number;
};

export type DecisionTrip = {
  weekNumber: number;
  departureDate: string;
  returnDate: string;
  route: string;
  airline: string | null;
  status: "issued" | "pending" | "rescheduled" | "cancelled";
};

const DAY_MS = 24 * 60 * 60 * 1000;

function parseBrazilianDate(value: string): Date | null {
  if (!/^\d{2}\/\d{2}\/\d{4}$/.test(value)) return null;
  const [day, month, year] = value.split("/").map(Number);
  const date = new Date(year, month - 1, day);
  return Number.isNaN(date.getTime()) ? null : date;
}

function getDaysUntil(dateValue: string, now: Date): number | null {
  const date = parseBrazilianDate(dateValue);
  if (!date) return null;
  const today = new Date(now);
  today.setHours(0, 0, 0, 0);
  date.setHours(0, 0, 0, 0);
  return Math.round((date.getTime() - today.getTime()) / DAY_MS);
}

function formatRoute(week: DecisionWeek): string {
  const departure = week.departureAirport?.trim();
  const arrival = week.returnAirport?.trim();
  return departure && arrival ? `${departure} → ${arrival}` : "Rota a definir";
}

function getLowestPrice(
  pricesByWeek: Record<number, Record<string, string>>,
  weekNumber: number
): number | null {
  const values = Object.values(pricesByWeek[weekNumber] ?? {})
    .map(value => Number.parseFloat(value))
    .filter(value => Number.isFinite(value) && value > 0);
  return values.length ? Math.min(...values) : null;
}

function formatPrice(price: number | null): string | null {
  if (price === null) return null;
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(price);
}

/**
 * Produz prioridades explicáveis apenas a partir de semanas e preços já carregados.
 * A função não persiste dados e facilita testar o ranking sem renderizar a Home.
 */
export function buildDecisionItems(
  weeks: DecisionWeek[],
  pricesByWeek: Record<number, Record<string, string>>,
  now: Date = new Date()
): DecisionItem[] {
  const items: DecisionItem[] = [];

  for (const week of weeks) {
    if (week.isDeleted) continue;
    const daysUntil = getDaysUntil(week.departureDate, now);
    if (daysUntil === null || daysUntil < -1) continue;

    const route = formatRoute(week);
    const price = formatPrice(getLowestPrice(pricesByWeek, week.weekNumber));
    const hasCancelled = Boolean(week.departureCancelled || week.returnCancelled);
    const hasRescheduled = Boolean(week.departureRescheduled || week.returnRescheduled);

    if (hasCancelled) {
      items.push({
        id: `cancelled-${week.weekNumber}`,
        severity: "critical",
        destination: "calendar",
        weekNumber: week.weekNumber,
        title: `Voo cancelado na semana ${week.weekNumber}`,
        reason: `${route} exige conferência dos trechos e das alternativas de viagem.`,
        actionLabel: "Abrir no Calendário",
        score: 1_000 + Math.max(0, 60 - daysUntil),
      });
      continue;
    }

    if (hasRescheduled) {
      items.push({
        id: `rescheduled-${week.weekNumber}`,
        severity: "warning",
        destination: "calendar",
        weekNumber: week.weekNumber,
        title: `Voo remarcado na semana ${week.weekNumber}`,
        reason: `${route} teve alteração de trecho; revise horários e conexão com a agenda.`,
        actionLabel: "Revisar no Calendário",
        score: 800 + Math.max(0, 45 - daysUntil),
      });
      continue;
    }

    if (!week.isTicketIssued) {
      const urgency = daysUntil <= 14 ? "critical" : "warning";
      const deadline = daysUntil <= 0 ? "A viagem começa hoje." : `Viagem em ${daysUntil} dia${daysUntil === 1 ? "" : "s"}.`;
      items.push({
        id: `pending-${week.weekNumber}`,
        severity: urgency,
        destination: "management",
        weekNumber: week.weekNumber,
        title: `Emitir passagem da semana ${week.weekNumber}`,
        reason: `${deadline}${price ? ` Menor preço registrado: ${price}.` : " Ainda não há preço registrado."}`,
        actionLabel: "Abrir Gestão",
        score: (urgency === "critical" ? 900 : 650) + Math.max(0, 90 - daysUntil),
      });
    }
  }

  return items
    .sort((a, b) => b.score - a.score || a.weekNumber - b.weekNumber)
    .slice(0, 3);
}

export function getNextDecisionTrip(
  weeks: DecisionWeek[],
  now: Date = new Date()
): DecisionTrip | null {
  const candidates = weeks
    .filter(week => !week.isDeleted)
    .map(week => ({ week, daysUntil: getDaysUntil(week.departureDate, now) }))
    .filter((candidate): candidate is { week: DecisionWeek; daysUntil: number } => candidate.daysUntil !== null)
    .filter(candidate => candidate.daysUntil >= -1)
    .sort((a, b) => a.daysUntil - b.daysUntil);

  const next = candidates[0]?.week;
  if (!next) return null;

  const status: DecisionTrip["status"] = next.departureCancelled || next.returnCancelled
    ? "cancelled"
    : next.departureRescheduled || next.returnRescheduled
      ? "rescheduled"
      : next.isTicketIssued
        ? "issued"
        : "pending";

  return {
    weekNumber: next.weekNumber,
    departureDate: next.departureDate,
    returnDate: next.returnDate,
    route: formatRoute(next),
    airline: next.departureAirline || next.returnAirline || null,
    status,
  };
}
