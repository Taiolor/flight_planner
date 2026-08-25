export const notificationLogStatuses = ["success", "partial", "failed"] as const;

export type NotificationLogStatus = (typeof notificationLogStatuses)[number];

export type NotificationLogDailySummary = {
  day: string;
  total: number;
  success: number;
  partial: number;
  failed: number;
};

type NotificationLogSummaryRow = {
  sentAt: Date | string;
  status: string;
};

function getBrazilianDayKey(sentAt: Date | string): string {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: "America/Sao_Paulo",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(new Date(sentAt));
  const values = Object.fromEntries(parts.map(part => [part.type, part.value]));

  return `${values.year}-${values.month}-${values.day}`;
}

export function summarizeNotificationLogsByDay(
  rows: NotificationLogSummaryRow[],
  maxDays = 7
): NotificationLogDailySummary[] {
  const summaries = new Map<string, NotificationLogDailySummary>();

  for (const row of rows) {
    if (!notificationLogStatuses.includes(row.status as NotificationLogStatus)) {
      continue;
    }
    const day = getBrazilianDayKey(row.sentAt);
    const summary = summaries.get(day) ?? {
      day,
      total: 0,
      success: 0,
      partial: 0,
      failed: 0,
    };

    summary.total += 1;
    summary[row.status as NotificationLogStatus] += 1;
    summaries.set(day, summary);
  }

  return [...summaries.values()]
    .sort((a, b) => b.day.localeCompare(a.day))
    .slice(0, maxDays);
}
