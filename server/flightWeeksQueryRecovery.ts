const TRANSIENT_DATABASE_CODES = new Set([
  "ECONNRESET",
  "ECONNREFUSED",
  "ETIMEDOUT",
  "EPIPE",
  "PROTOCOL_CONNECTION_LOST",
  "ER_CON_COUNT_ERROR",
  "ER_LOCK_WAIT_TIMEOUT",
]);

type DatabaseErrorLike = {
  code?: unknown;
  message?: unknown;
  cause?: unknown;
};

function getErrorChain(error: unknown): DatabaseErrorLike[] {
  const entries: DatabaseErrorLike[] = [];
  let current = error;

  while (current && typeof current === "object" && entries.length < 3) {
    const entry = current as DatabaseErrorLike;
    entries.push(entry);
    current = entry.cause;
  }

  return entries;
}

export function isTransientFlightWeeksReadError(error: unknown): boolean {
  return getErrorChain(error).some(entry => {
    const code = typeof entry.code === "string" ? entry.code : "";
    const message = typeof entry.message === "string" ? entry.message : "";
    return (
      TRANSIENT_DATABASE_CODES.has(code) ||
      /connection (?:lost|reset|refused)|socket hang up|timed out/i.test(message)
    );
  });
}

const wait = (durationMs: number) =>
  new Promise<void>(resolve => setTimeout(resolve, durationMs));

/** Executa uma segunda tentativa curta somente quando o driver indica instabilidade de conexão. */
export async function retryTransientFlightWeeksRead<T>(
  read: () => Promise<T>,
  options: { retryDelayMs?: number } = {}
): Promise<T> {
  try {
    return await read();
  } catch (error) {
    if (!isTransientFlightWeeksReadError(error)) throw error;

    await wait(options.retryDelayMs ?? 250);
    return read();
  }
}
