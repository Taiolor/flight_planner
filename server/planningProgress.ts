export type PlanningProgressWeek = {
  isDeleted?: number | null;
  isTicketIssued: number | null;
};

export type YearPlanningProgress = {
  year: number;
  totalWeeks: number;
  issuedWeeks: number;
  pendingWeeks: number;
  completionPercent: number;
};

export function summarizeYearPlanningProgress(
  year: number,
  weeks: PlanningProgressWeek[]
): YearPlanningProgress {
  const activeWeeks = weeks.filter(week => !week.isDeleted);
  const issuedWeeks = activeWeeks.filter(week => Boolean(week.isTicketIssued)).length;
  const totalWeeks = activeWeeks.length;

  return {
    year,
    totalWeeks,
    issuedWeeks,
    pendingWeeks: totalWeeks - issuedWeeks,
    completionPercent:
      totalWeeks === 0 ? 0 : Math.round((issuedWeeks / totalWeeks) * 100),
  };
}
