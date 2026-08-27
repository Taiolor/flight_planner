import type { DecisionItem, DecisionSeverity, DecisionWeek } from "./decisionCenter";

const DAY_MS = 24 * 60 * 60 * 1000;
const WEATHER_HORIZON_DAYS = 5;
const RAIN_ALERT_THRESHOLD = 40;

type WeatherDailyForecast = {
  date: string;
  summary: string;
  precipitationProbability: number;
};

export type DecisionWeatherTarget = {
  weekNumber: number;
  direction: "departure" | "return";
  airportCode: string;
  flightDate: string;
  flightTime?: string;
  daysUntil: number;
  routeLabel: string;
};

export type DecisionWeatherForecast = {
  available: boolean;
  forecastDate?: string;
  dailyForecast?: WeatherDailyForecast[];
};

function parseBrazilianDate(value: string): Date | null {
  if (!/^\d{2}\/\d{2}\/\d{4}$/.test(value)) return null;
  const [day, month, year] = value.split("/").map(Number);
  const date = new Date(year, month - 1, day);
  return Number.isNaN(date.getTime()) ? null : date;
}

function toIsoDate(value: string | null | undefined, fallback: string): string | null {
  if (value?.match(/^\d{4}-\d{2}-\d{2}/)) return value.slice(0, 10);
  const parsed = parseBrazilianDate(fallback);
  if (!parsed) return null;
  return `${parsed.getFullYear()}-${String(parsed.getMonth() + 1).padStart(2, "0")}-${String(parsed.getDate()).padStart(2, "0")}`;
}

function getFlightTime(value: string | null | undefined): string | undefined {
  const matched = value?.match(/T(\d{2}:\d{2})/);
  return matched?.[1];
}

function getDaysUntil(isoDate: string, now: Date): number {
  const [year, month, day] = isoDate.split("-").map(Number);
  const date = new Date(year, month - 1, day);
  const today = new Date(now);
  today.setHours(0, 0, 0, 0);
  date.setHours(0, 0, 0, 0);
  return Math.round((date.getTime() - today.getTime()) / DAY_MS);
}

function airportCode(value: string | null | undefined): string | null {
  const normalized = value?.trim().toUpperCase() ?? "";
  return /^[A-Z]{3}$/.test(normalized) ? normalized : null;
}

/** Localiza o próximo trecho elegível para previsão dentro da janela da fonte meteorológica. */
export function getNextDecisionWeatherTarget(
  weeks: DecisionWeek[],
  now: Date = new Date()
): DecisionWeatherTarget | null {
  const candidates: DecisionWeatherTarget[] = [];

  for (const week of weeks) {
    if (week.isDeleted) continue;
    const departureDestination = airportCode(week.returnAirport);
    const departureDate = toIsoDate(week.departureFlightDatetime, week.departureDate);
    if (!week.departureCancelled && departureDestination && departureDate) {
      candidates.push({
        weekNumber: week.weekNumber,
        direction: "departure",
        airportCode: departureDestination,
        flightDate: departureDate,
        flightTime: getFlightTime(week.departureFlightDatetime),
        daysUntil: getDaysUntil(departureDate, now),
        routeLabel: `${week.departureAirport ?? "Origem"} → ${departureDestination}`,
      });
    }

    const returnDestination = airportCode(week.departureAirport);
    const returnDate = toIsoDate(week.returnFlightDatetime, week.returnDate);
    if (week.ticketType !== "oneway" && !week.returnCancelled && returnDestination && returnDate) {
      candidates.push({
        weekNumber: week.weekNumber,
        direction: "return",
        airportCode: returnDestination,
        flightDate: returnDate,
        flightTime: getFlightTime(week.returnFlightDatetime),
        daysUntil: getDaysUntil(returnDate, now),
        routeLabel: `${week.returnAirport ?? "Origem"} → ${returnDestination}`,
      });
    }
  }

  return candidates
    .filter(candidate => candidate.daysUntil >= 0 && candidate.daysUntil <= WEATHER_HORIZON_DAYS)
    .sort((left, right) => left.daysUntil - right.daysUntil || left.weekNumber - right.weekNumber)[0] ?? null;
}

/** Transforma probabilidade de chuva relevante em uma prioridade explicável da Central. */
export function buildRainDecisionItem(
  target: DecisionWeatherTarget | null,
  weather: DecisionWeatherForecast | undefined
): DecisionItem | null {
  if (!target || !weather?.available) return null;
  const forecast = weather.dailyForecast?.find(day => day.date === target.flightDate)
    ?? (weather.forecastDate === target.flightDate ? weather.dailyForecast?.[0] : undefined);
  const precipitationProbability = forecast?.precipitationProbability ?? 0;
  if (precipitationProbability < RAIN_ALERT_THRESHOLD) return null;

  const severity: DecisionSeverity = precipitationProbability >= 70 && target.daysUntil <= 2
    ? "critical"
    : "warning";
  const when = target.daysUntil === 0
    ? "hoje"
    : `em ${target.daysUntil} dia${target.daysUntil === 1 ? "" : "s"}`;

  return {
    id: `rain-${target.weekNumber}-${target.direction}-${target.flightDate}`,
    kind: "weather",
    severity,
    destination: "calendar",
    weekNumber: target.weekNumber,
    title: `Chuva prevista para a semana ${target.weekNumber}`,
    reason: `${target.routeLabel} ${when}: ${precipitationProbability}% de chance de chuva${forecast?.summary ? ` · ${forecast.summary.toLocaleLowerCase("pt-BR")}` : ""}. Planeje deslocamento e embarque com antecedência.`,
    actionLabel: "Ver no Calendário",
    score: (severity === "critical" ? 875 : 700) + precipitationProbability + Math.max(0, WEATHER_HORIZON_DAYS - target.daysUntil),
    price: null,
    priceVariationPercent: null,
    manualAdjustment: 0,
  };
}
