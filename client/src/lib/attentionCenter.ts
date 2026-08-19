export type AttentionWeek = {
  weekNumber: number;
  departureDate: string;
  isDeleted?: number;
  isTicketIssued: number;
  departureCancelled?: number;
  returnCancelled?: number;
};

export type AttentionItem = {
  id: string;
  kind: "cancellation" | "deadline" | "price";
  severity: "critical" | "urgent" | "warning";
  weekNumber: number;
  title: string;
  description: string;
  actionLabel: string;
  price?: number;
  variationPercent?: number;
};

export type DismissedAttentionItems = Record<string, string>;

export const ATTENTION_DISMISSALS_STORAGE_KEY =
  "viagens.attention-dismissals.v1";
export const ATTENTION_DISMISSAL_DURATION_MS = 24 * 60 * 60 * 1000;

export function readAttentionDismissals(
  now = new Date(),
  storage: Pick<Storage, "getItem" | "setItem"> | null =
    typeof window === "undefined" ? null : window.localStorage
): DismissedAttentionItems {
  if (!storage) return {};

  try {
    const raw = storage.getItem(ATTENTION_DISMISSALS_STORAGE_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw) as Record<string, unknown>;
    const valid = Object.fromEntries(
      Object.entries(parsed).filter(([, expiresAt]) => {
        const expiry = typeof expiresAt === "string" ? new Date(expiresAt) : null;
        return expiry !== null && !Number.isNaN(expiry.getTime()) && expiry > now;
      })
    ) as DismissedAttentionItems;
    storage.setItem(ATTENTION_DISMISSALS_STORAGE_KEY, JSON.stringify(valid));
    return valid;
  } catch {
    return {};
  }
}

export function dismissAttentionItem(
  itemId: string,
  now = new Date(),
  storage: Pick<Storage, "getItem" | "setItem"> | null =
    typeof window === "undefined" ? null : window.localStorage
): DismissedAttentionItems {
  const next = {
    ...readAttentionDismissals(now, storage),
    [itemId]: new Date(now.getTime() + ATTENTION_DISMISSAL_DURATION_MS).toISOString(),
  };
  storage?.setItem(ATTENTION_DISMISSALS_STORAGE_KEY, JSON.stringify(next));
  return next;
}

export function restoreAttentionItem(
  itemId: string,
  now = new Date(),
  storage: Pick<Storage, "getItem" | "setItem"> | null =
    typeof window === "undefined" ? null : window.localStorage
): DismissedAttentionItems {
  const next = readAttentionDismissals(now, storage);
  delete next[itemId];
  storage?.setItem(ATTENTION_DISMISSALS_STORAGE_KEY, JSON.stringify(next));
  return next;
}

function parsePlannerDate(value: string): Date | null {
  const br = /^(\d{2})\/(\d{2})\/(\d{4})$/.exec(value);
  const iso = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
  const date = br
    ? new Date(Number(br[3]), Number(br[2]) - 1, Number(br[1]))
    : iso
      ? new Date(Number(iso[1]), Number(iso[2]) - 1, Number(iso[3]))
      : null;
  return date && !Number.isNaN(date.getTime()) ? date : null;
}

function daysUntil(dateString: string, now: Date): number | null {
  const date = parsePlannerDate(dateString);
  if (!date) return null;
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  return Math.round((date.getTime() - today.getTime()) / 86_400_000);
}

function median(values: number[]): number | null {
  if (values.length === 0) return null;
  const ordered = [...values].sort((a, b) => a - b);
  const middle = Math.floor(ordered.length / 2);
  return ordered.length % 2 === 0
    ? (ordered[middle - 1] + ordered[middle]) / 2
    : ordered[middle];
}

function lowestPrice(prices: Record<string, string> | undefined): number | null {
  if (!prices) return null;
  const values = Object.values(prices)
    .map(value => Number.parseFloat(value))
    .filter(value => Number.isFinite(value) && value > 0);
  return values.length > 0 ? Math.min(...values) : null;
}

const priority = { critical: 0, urgent: 1, warning: 2 } as const;

export function buildAttentionItems(
  weeks: AttentionWeek[],
  priceMap: Record<number, Record<string, string>>,
  now = new Date()
): AttentionItem[] {
  const activeWeeks = weeks.filter(week => !week.isDeleted);
  const priceReference = median(
    activeWeeks
      .map(week => lowestPrice(priceMap[week.weekNumber]))
      .filter((value): value is number => value !== null)
  );
  const items: AttentionItem[] = [];

  for (const week of activeWeeks) {
    const departureInDays = daysUntil(week.departureDate, now);
    const isUpcoming = departureInDays !== null && departureInDays >= -1;

    if (isUpcoming && week.departureCancelled) {
      items.push({
        id: `departure-cancelled-${week.weekNumber}`,
        kind: "cancellation",
        severity: "critical",
        weekNumber: week.weekNumber,
        title: `Ida cancelada · Semana ${week.weekNumber}`,
        description: `Revise ou remarque o trecho de ida programado para ${week.departureDate}.`,
        actionLabel: "Revisar semana",
      });
    }

    if (isUpcoming && week.returnCancelled) {
      items.push({
        id: `return-cancelled-${week.weekNumber}`,
        kind: "cancellation",
        severity: "critical",
        weekNumber: week.weekNumber,
        title: `Volta cancelada · Semana ${week.weekNumber}`,
        description: `Revise ou remarque o trecho de volta desta viagem.`,
        actionLabel: "Revisar semana",
      });
    }

    if (
      departureInDays !== null &&
      departureInDays >= 0 &&
      departureInDays <= 15 &&
      !week.isTicketIssued
    ) {
      const dayLabel =
        departureInDays === 0
          ? "hoje"
          : departureInDays === 1
            ? "amanhã"
            : `em ${departureInDays} dias`;
      items.push({
        id: `purchase-deadline-${week.weekNumber}`,
        kind: "deadline",
        severity: "urgent",
        weekNumber: week.weekNumber,
        title: `Compra pendente · Semana ${week.weekNumber}`,
        description: `A ida acontece ${dayLabel}, em ${week.departureDate}.`,
        actionLabel: "Adicionar passagem",
      });
    }

    const price = lowestPrice(priceMap[week.weekNumber]);
    if (
      isUpcoming &&
      price !== null &&
      priceReference !== null &&
      price >= priceReference * 1.2
    ) {
      const variationPercent = Math.round(
        ((price - priceReference) / priceReference) * 100
      );
      items.push({
        id: `price-variation-${week.weekNumber}`,
        kind: "price",
        severity: "warning",
        weekNumber: week.weekNumber,
        title: `Preço acima da referência · Semana ${week.weekNumber}`,
        description: `Menor cotação ${variationPercent}% acima da referência anual.`,
        actionLabel: "Ver cotações",
        price,
        variationPercent,
      });
    }
  }

  return items.sort((a, b) => {
    const priorityDiff = priority[a.severity] - priority[b.severity];
    if (priorityDiff !== 0) return priorityDiff;
    return a.weekNumber - b.weekNumber;
  });
}
