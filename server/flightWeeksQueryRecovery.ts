const TRANSIENT_DATABASE_CODES = new Set([
  "ECONNRESET",
  "ECONNREFUSED",
  "ETIMEDOUT",
  "EPIPE",
  "PROTOCOL_CONNECTION_LOST",
  "ER_CON_COUNT_ERROR",
  "ER_LOCK_WAIT_TIMEOUT",
]);

const SCHEMA_DATABASE_CODES = new Set([
  "ER_BAD_FIELD_ERROR",
  "ER_NO_SUCH_TABLE",
  "ER_BAD_TABLE_ERROR",
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

export function isFlightWeeksSchemaMismatchError(error: unknown): boolean {
  return getErrorChain(error).some(entry => {
    const code = typeof entry.code === "string" ? entry.code : "";
    const message = typeof entry.message === "string" ? entry.message : "";
    return (
      SCHEMA_DATABASE_CODES.has(code) ||
      /unknown column|table .* doesn't exist|table .* does not exist/i.test(message)
    );
  });
}

const wait = (durationMs: number) =>
  new Promise<void>(resolve => setTimeout(resolve, durationMs));

/** Executa uma segunda tentativa curta somente quando o driver indica instabilidade de conexão. */
export async function retryTransientFlightWeeksRead<T>(
  read: () => Promise<T>,
  options: {
    retryDelayMs?: number;
    onTransientFailure?: (error: unknown) => void | Promise<void>;
  } = {}
): Promise<T> {
  try {
    return await read();
  } catch (error) {
    if (!isTransientFlightWeeksReadError(error)) throw error;

    try {
      await options.onTransientFailure?.(error);
    } catch {
      // A telemetria de recuperação não pode bloquear a nova tentativa de leitura.
    }
    await wait(options.retryDelayMs ?? 250);
    return read();
  }
}
