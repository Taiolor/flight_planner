export type WeeklyWindowPosition = "previous" | "current" | "next";

export type WeeklyWindowItem<T> = {
  item: T;
  position: WeeklyWindowPosition;
};

type PlanningWeek = {
  weekNumber: number;
  isDeleted?: number | boolean;
};

export function getIsoWeekNumber(date: Date): number {
  const utc = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  const weekday = utc.getUTCDay() || 7;
  utc.setUTCDate(utc.getUTCDate() + 4 - weekday);
  const yearStart = new Date(Date.UTC(utc.getUTCFullYear(), 0, 1));
  return Math.ceil(((utc.getTime() - yearStart.getTime()) / 86400000 + 1) / 7);
}

export function getWeeklyPlanningWindow<T extends PlanningWeek>(
  weeks: T[],
  selectedYear: number,
  now: Date = new Date()
): WeeklyWindowItem<T>[] {
  const activeWeeks = weeks
    .filter(week => !week.isDeleted)
    .sort((first, second) => first.weekNumber - second.weekNumber);
  if (activeWeeks.length === 0) return [];

  const referenceWeek =
    selectedYear === now.getFullYear()
      ? getIsoWeekNumber(now)
      : activeWeeks[0].weekNumber;
  const exactIndex = activeWeeks.findIndex(week => week.weekNumber === referenceWeek);
  const currentIndex =
    exactIndex >= 0
      ? exactIndex
      : Math.max(0, activeWeeks.findIndex(week => week.weekNumber > referenceWeek));
  const resolvedCurrentIndex = currentIndex < 0 ? activeWeeks.length - 1 : currentIndex;

  return [
    { index: resolvedCurrentIndex - 1, position: "previous" as const },
    { index: resolvedCurrentIndex, position: "current" as const },
    { index: resolvedCurrentIndex + 1, position: "next" as const },
  ].flatMap(({ index, position }) =>
    activeWeeks[index] ? [{ item: activeWeeks[index], position }] : []
  );
}
