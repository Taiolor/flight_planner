const planningSyncPrefix = "smartfly:planning-sync";
const latestPlanningSyncKey = `${planningSyncPrefix}:latest`;

function isValidTimestamp(value: unknown): value is number {
  return typeof value === "number" && Number.isFinite(value) && value > 0;
}

function readTimestamp(key: string): number | null {
  if (typeof window === "undefined") return null;
  const raw = window.localStorage.getItem(key);
  if (!raw) return null;
  const parsed = Number(raw);
  return isValidTimestamp(parsed) ? parsed : null;
}

export function readPlanningSyncTimestamp(year: number): number | null {
  return readTimestamp(`${planningSyncPrefix}:${year}`);
}

export function readLatestPlanningSyncTimestamp(): number | null {
  return readTimestamp(latestPlanningSyncKey);
}

/** Persiste somente metadados de atualização local, nunca dados de viagem ou dados pessoais. */
export function savePlanningSyncTimestamp(year: number, timestamp = Date.now()) {
  if (typeof window === "undefined" || !isValidTimestamp(timestamp)) return;
  window.localStorage.setItem(`${planningSyncPrefix}:${year}`, String(timestamp));
  window.localStorage.setItem(latestPlanningSyncKey, String(timestamp));
}

export function formatPlanningSyncTimestamp(timestamp: number | null): string | null {
  if (!timestamp) return null;
  return new Date(timestamp).toLocaleString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}
