import { describe, expect, it } from "vitest";
import { summarizeNotificationLogsByDay } from "./notificationLogAnalytics";

describe("summarizeNotificationLogsByDay", () => {
  it("agrupa resultados pelo dia de São Paulo e contabiliza cada status", () => {
    const summaries = summarizeNotificationLogsByDay([
      { sentAt: "2026-08-25T02:30:00.000Z", status: "success" },
      { sentAt: "2026-08-25T14:00:00.000Z", status: "partial" },
      { sentAt: "2026-08-25T16:00:00.000Z", status: "failed" },
    ]);

    expect(summaries).toEqual([
      { day: "2026-08-25", total: 2, success: 0, partial: 1, failed: 1 },
      { day: "2026-08-24", total: 1, success: 1, partial: 0, failed: 0 },
    ]);
  });

  it("prioriza os dias mais recentes dentro do limite solicitado", () => {
    const summaries = summarizeNotificationLogsByDay(
      [
        { sentAt: "2026-08-20T15:00:00.000Z", status: "success" },
        { sentAt: "2026-08-21T15:00:00.000Z", status: "success" },
        { sentAt: "2026-08-22T15:00:00.000Z", status: "failed" },
      ],
      2
    );

    expect(summaries.map(summary => summary.day)).toEqual([
      "2026-08-22",
      "2026-08-21",
    ]);
  });
});
