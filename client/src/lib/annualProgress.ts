export type AnnualProgressWeek = {
  departureDate: string;
  isDeleted?: number;
  isTicketIssued: number;
};

export type AnnualProgress = {
  totalWeeks: number;
  issuedWeeks: number;
  pendingWeeks: number;
  urgentWeeks: number;
  completionPercent: number;
};

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

export function getAnnualProgress(
  weeks: AnnualProgressWeek[],
  now = new Date()
): AnnualProgress {
  const activeWeeks = weeks.filter(week => !week.isDeleted);
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  let issuedWeeks = 0;
  let urgentWeeks = 0;

  for (const week of activeWeeks) {
    if (week.isTicketIssued) {
      issuedWeeks += 1;
      continue;
    }
    const departure = parsePlannerDate(week.departureDate);
    if (!departure) continue;
    const days = Math.round((departure.getTime() - today.getTime()) / 86_400_000);
    if (days >= 0 && days <= 15) urgentWeeks += 1;
  }

  const totalWeeks = activeWeeks.length;
  const pendingWeeks = totalWeeks - issuedWeeks;
  return {
    totalWeeks,
    issuedWeeks,
    pendingWeeks,
    urgentWeeks,
    completionPercent:
      totalWeeks === 0 ? 0 : Math.round((issuedWeeks / totalWeeks) * 100),
  };
}
