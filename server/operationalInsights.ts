export type OperationalWeek = {
  weekNumber: number;
  departureDate: string;
  returnDate: string;
  isTicketIssued: number;
  isDeleted: number;
  ticketType: string | null;
  returnFlightDatetime: string | null;
  returnCancelled: number;
};

export type OperationalQuote = {
  weekNumber: number;
  lowestPrice: number;
  quotedAt: Date;
};

export type OperationalCredit = {
  id: number;
  airline: string;
  creditType: "credito" | "voucher" | "reembolso";
  availableCents: number;
  expiresAt: Date | null;
  status: "ativo" | "usado" | "expirado";
  linkedWeekNumber: number | null;
};

export type OperationalDecision = {
  id: string;
  kind: "purchase" | "price" | "conflict" | "credit" | "checklist";
  severity: "critical" | "warning" | "info";
  title: string;
  description: string;
  weekNumber?: number;
  creditId?: number;
};

function toDateOnly(value: string) {
  return new Date(`${value.slice(0, 10)}T12:00:00`);
}

function daysUntil(value: string, now: Date) {
  return Math.ceil((toDateOnly(value).getTime() - now.getTime()) / 86_400_000);
}

export function buildOperationalInsights(
  weeks: OperationalWeek[],
  quotes: OperationalQuote[],
  credits: OperationalCredit[],
  incompleteChecklistCount: Map<number, number>,
  now = new Date()
) {
  const activeWeeks = weeks.filter(week => !week.isDeleted);
  const quoteByWeek = new Map<number, OperationalQuote>();
  for (const quote of quotes) {
    const current = quoteByWeek.get(quote.weekNumber);
    if (!current || quote.quotedAt > current.quotedAt) quoteByWeek.set(quote.weekNumber, quote);
  }

  const historicalPrices = quotes.map(quote => quote.lowestPrice);
  const historicalFloor = historicalPrices.length
    ? Math.min(...historicalPrices)
    : null;
  const decisions: OperationalDecision[] = [];

  for (const week of activeWeeks) {
    const untilDeparture = daysUntil(week.departureDate, now);
    const incompleteItems = incompleteChecklistCount.get(week.weekNumber) ?? 0;

    if (!week.isTicketIssued && untilDeparture >= 0) {
      decisions.push({
        id: `purchase-${week.weekNumber}`,
        kind: "purchase",
        severity: untilDeparture <= 15 ? "critical" : untilDeparture <= 30 ? "warning" : "info",
        weekNumber: week.weekNumber,
        title: `Emitir a Semana ${week.weekNumber}`,
        description: `A ida está prevista para ${week.departureDate} (${untilDeparture} ${untilDeparture === 1 ? "dia" : "dias"}).`,
      });
    }

    const currentQuote = quoteByWeek.get(week.weekNumber);
    if (
      !week.isTicketIssued &&
      currentQuote &&
      historicalFloor &&
      currentQuote.lowestPrice >= Math.round(historicalFloor * 1.2)
    ) {
      const variation = Math.round((currentQuote.lowestPrice / historicalFloor - 1) * 100);
      decisions.push({
        id: `price-${week.weekNumber}`,
        kind: "price",
        severity: variation >= 35 ? "critical" : "warning",
        weekNumber: week.weekNumber,
        title: `Cotação elevada na Semana ${week.weekNumber}`,
        description: `A última cotação está ${variation}% acima do menor valor registrado no exercício.`,
      });
    }

    if (
      week.isTicketIssued &&
      week.ticketType !== "oneway" &&
      (!week.returnFlightDatetime || week.returnCancelled)
    ) {
      decisions.push({
        id: `conflict-${week.weekNumber}`,
        kind: "conflict",
        severity: "critical",
        weekNumber: week.weekNumber,
        title: `Retorno pendente na Semana ${week.weekNumber}`,
        description: week.returnCancelled
          ? "O retorno emitido foi cancelado e precisa ser replanejado."
          : "O bilhete indica ida e volta, mas não há retorno confirmado.",
      });
    }

    if (week.isTicketIssued && incompleteItems > 0 && untilDeparture >= 0 && untilDeparture <= 7) {
      decisions.push({
        id: `checklist-${week.weekNumber}`,
        kind: "checklist",
        severity: "warning",
        weekNumber: week.weekNumber,
        title: `Checklist pendente na Semana ${week.weekNumber}`,
        description: `${incompleteItems} ${incompleteItems === 1 ? "item permanece" : "itens permanecem"} sem confirmação antes da viagem.`,
      });
    }
  }

  for (const credit of credits) {
    if (credit.status !== "ativo" || credit.availableCents <= 0 || !credit.expiresAt) continue;
    const expiresIn = Math.ceil((credit.expiresAt.getTime() - now.getTime()) / 86_400_000);
    if (expiresIn >= 0 && expiresIn <= 45) {
      decisions.push({
        id: `credit-${credit.id}`,
        kind: "credit",
        severity: expiresIn <= 15 ? "critical" : "warning",
        creditId: credit.id,
        title: `${credit.creditType === "voucher" ? "Voucher" : "Crédito"} próximo do vencimento`,
        description: `${credit.airline.toUpperCase()} expira em ${expiresIn} ${expiresIn === 1 ? "dia" : "dias"}.`,
      });
    }
  }

  const weight = { critical: 0, warning: 1, info: 2 } as const;
  return decisions.sort((left, right) => weight[left.severity] - weight[right.severity]);
}
