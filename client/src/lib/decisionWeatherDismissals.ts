const STORAGE_PREFIX = "viagens.decision-weather-dismissals";
const MAX_DISMISSED_ALERTS = 40;

function storageKey(year: number) {
  return `${STORAGE_PREFIX}.${year}.v1`;
}

export function readDecisionWeatherDismissals(
  year: number,
  storage: Pick<Storage, "getItem"> | null = typeof window === "undefined" ? null : window.localStorage
): string[] {
  const raw = storage?.getItem(storageKey(year));
  if (!raw) return [];

  try {
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return [...new Set(parsed.filter((value): value is string => typeof value === "string" && /^weather-\d+-\d{4}-\d{2}-\d{2}$/.test(value)))].slice(0, MAX_DISMISSED_ALERTS);
  } catch {
    return [];
  }
}

export function saveDecisionWeatherDismissals(
  year: number,
  alertIds: string[],
  storage: Pick<Storage, "setItem"> | null = typeof window === "undefined" ? null : window.localStorage
) {
  const normalized = [...new Set(alertIds.filter(value => /^weather-\d+-\d{4}-\d{2}-\d{2}$/.test(value)))].slice(0, MAX_DISMISSED_ALERTS);
  storage?.setItem(storageKey(year), JSON.stringify(normalized));
}

export function dismissDecisionWeatherAlert(alertIds: string[], alertId: string): string[] {
  return alertIds.includes(alertId) ? alertIds : [...alertIds, alertId].slice(-MAX_DISMISSED_ALERTS);
}
