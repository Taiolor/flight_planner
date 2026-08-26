export const MAX_NOTIFICATION_LOG_SEARCH_LENGTH = 100;

export function normalizeNotificationLogSearch(search?: string) {
  if (!search) return undefined;

  const normalized = search.trim().replace(/\s+/g, " ");
  return normalized ? normalized.slice(0, MAX_NOTIFICATION_LOG_SEARCH_LENGTH) : undefined;
}

export function buildNotificationLogSearchPattern(search?: string) {
  const normalized = normalizeNotificationLogSearch(search);
  if (!normalized) return undefined;

  return `%${normalized.replace(/[\\%_]/g, "\\$&")}%`;
}
