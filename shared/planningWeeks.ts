export const MIN_PLANNING_YEAR = 2020;
export const MAX_PLANNING_YEAR = 2100;

export interface GeneratedPlanningWeek {
  weekNumber: number;
  departureDate: string;
  returnDate: string;
  departureDayOfWeek: "Domingo";
  returnDayOfWeek: "Sexta";
  holiday: null;
}

function assertPlanningYear(year: number) {
  if (!Number.isInteger(year) || year < MIN_PLANNING_YEAR || year > MAX_PLANNING_YEAR) {
    throw new Error(
      `Ano de planejamento inválido: ${year}. Informe um ano entre ${MIN_PLANNING_YEAR} e ${MAX_PLANNING_YEAR}.`
    );
  }
}

function addUtcDays(date: Date, days: number) {
  const next = new Date(date.getTime());
  next.setUTCDate(next.getUTCDate() + days);
  return next;
}

function formatDate(date: Date) {
  const day = String(date.getUTCDate()).padStart(2, "0");
  const month = String(date.getUTCMonth() + 1).padStart(2, "0");
  return `${day}/${month}/${date.getUTCFullYear()}`;
}

/**
 * Gera uma agenda anual determinística: toda ida ocorre no domingo e o retorno
 * correspondente ocorre na sexta-feira seguinte. O número da semana é uma chave
 * sequencial do planejamento (não uma semana ISO) e reinicia a cada exercício.
 */
export function generatePlanningWeeks(year: number): GeneratedPlanningWeek[] {
  assertPlanningYear(year);

  const firstDay = new Date(Date.UTC(year, 0, 1));
  const daysUntilSunday = (7 - firstDay.getUTCDay()) % 7;
  const lastDay = new Date(Date.UTC(year, 11, 31));
  const weeks: GeneratedPlanningWeek[] = [];

  for (
    let departure = addUtcDays(firstDay, daysUntilSunday), weekNumber = 1;
    departure <= lastDay;
    departure = addUtcDays(departure, 7), weekNumber += 1
  ) {
    const returnDate = addUtcDays(departure, 5);
    weeks.push({
      weekNumber,
      departureDate: formatDate(departure),
      returnDate: formatDate(returnDate),
      departureDayOfWeek: "Domingo",
      returnDayOfWeek: "Sexta",
      holiday: null,
    });
  }

  return weeks;
}
