export type WeeklyWindowPosition = "previous" | "current" | "next";

export type WeeklyWindowItem<T> = {
  item: T;
  position: WeeklyWindowPosition;
};

type PlanningWeek = {
  weekNumber: number;
  isDeleted?: number | boolean;
  departureDate?: string;
  returnDate?: string;
};

function parseBrazilianDate(value?: string): Date | null {
  if (!value) return null;
  const [day, month, year] = value.split("/").map(Number);
  if (!day || !month || !year) return null;

  const date = new Date(year, month - 1, day);
  return Number.isNaN(date.getTime()) ? null : date;
}

function startOfDay(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

function getCurrentWeekIndexFromTravelDates<T extends PlanningWeek>(
  weeks: T[],
  now: Date
): number | null {
  const today = startOfDay(now).getTime();
  const datedWeeks = weeks.map((week, index) => {
    const departure = parseBrazilianDate(week.departureDate);
    const returnTrip = parseBrazilianDate(week.returnDate) ?? departure;
    return { index, departure, returnTrip };
  });

  if (!datedWeeks.every(({ departure, returnTrip }) => departure && returnTrip)) {
    return null;
  }

  const activeTripIndex = datedWeeks.find(
    ({ departure, returnTrip }) =>
      departure!.getTime() <= today && today <= returnTrip!.getTime()
  )?.index;
  if (activeTripIndex !== undefined) return activeTripIndex;

  const nextTripIndex = datedWeeks.find(
    ({ departure }) => departure!.getTime() > today
  )?.index;
  return nextTripIndex ?? datedWeeks.length - 1;
}

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

  const travelDateIndex =
    selectedYear === now.getFullYear()
      ? getCurrentWeekIndexFromTravelDates(activeWeeks, now)
      : null;
  const referenceWeek = getIsoWeekNumber(now);
  const exactIndex = activeWeeks.findIndex(week => week.weekNumber === referenceWeek);
  const fallbackIndex =
    exactIndex >= 0
      ? exactIndex
      : Math.max(0, activeWeeks.findIndex(week => week.weekNumber > referenceWeek));
  const resolvedCurrentIndex =
    travelDateIndex ??
    (selectedYear === now.getFullYear()
      ? fallbackIndex < 0
        ? activeWeeks.length - 1
        : fallbackIndex
      : 0);

  return [
    { index: resolvedCurrentIndex - 1, position: "previous" as const },
    { index: resolvedCurrentIndex, position: "current" as const },
    { index: resolvedCurrentIndex + 1, position: "next" as const },
  ].flatMap(({ index, position }) =>
    activeWeeks[index] ? [{ item: activeWeeks[index], position }] : []
  );
}
