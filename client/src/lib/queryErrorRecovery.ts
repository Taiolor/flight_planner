import { TRPCClientError } from "@trpc/client";

/**
 * Falhas iniciadas por "Failed query" podem ocorrer durante uma reconexão curta
 * do banco ou reinício do servidor. Erros de regra de negócio continuam sem retry.
 */
export function isRetryableDatabaseQueryError(error: unknown): boolean {
  return (
    error instanceof TRPCClientError &&
    error.message.startsWith("Failed query:")
  );
}
