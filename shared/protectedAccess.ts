export const PROTECTED_ACCESS_RESOURCES = [
  "fly-ia",
  "share-by-email",
  "quotes",
  "financial",
  "memories",
  "admin-notifications",
  "admin-telemetry",
  "gemini-budget",
] as const;

export type ProtectedAccessResource =
  (typeof PROTECTED_ACCESS_RESOURCES)[number];
