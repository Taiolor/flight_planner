import { describe, expect, it } from "vitest";
import { buildNotificationLogPage } from "./notificationLogPagination";

const rows = [
  { id: 9, sentAt: new Date("2026-08-18T12:00:00.000Z") },
  { id: 8, sentAt: new Date("2026-08-18T11:00:00.000Z") },
  { id: 7, sentAt: new Date("2026-08-18T10:00:00.000Z") },
];

describe("paginação de logs de notificação", () => {
  it("retorna cursor do último item quando existe outra página", () => {
    const page = buildNotificationLogPage(rows, 2);

    expect(page.items.map(item => item.id)).toEqual([9, 8]);
    expect(page.nextCursor).toEqual({
      id: 8,
      sentAt: new Date("2026-08-18T11:00:00.000Z"),
    });
  });

  it("não retorna cursor quando todos os registros cabem na página", () => {
    const page = buildNotificationLogPage(rows.slice(0, 2), 2);

    expect(page.items).toHaveLength(2);
    expect(page.nextCursor).toBeNull();
  });
});
