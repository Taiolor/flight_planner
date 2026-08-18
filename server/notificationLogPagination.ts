export interface NotificationLogCursor {
  id: number;
  sentAt: Date;
}

export function buildNotificationLogPage<T extends NotificationLogCursor>(
  rows: T[],
  pageSize: number
) {
  const hasMore = rows.length > pageSize;
  const items = hasMore ? rows.slice(0, pageSize) : rows;
  const lastItem = items.at(-1);

  return {
    items,
    nextCursor:
      hasMore && lastItem
        ? { id: lastItem.id, sentAt: lastItem.sentAt }
        : null,
  };
}
