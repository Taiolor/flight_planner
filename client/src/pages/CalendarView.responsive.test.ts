import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

describe("Calendar mobile responsiveness", () => {
  const calendarSource = readFileSync(
    resolve(process.cwd(), "client/src/pages/CalendarView.tsx"),
    "utf8"
  );
  const cupSource = readFileSync(
    resolve(process.cwd(), "client/src/components/BrazilWorldCupPanel.tsx"),
    "utf8"
  );

  it("uses a compact, non-growing monthly flight counter", () => {
    expect(calendarSource).toContain("flex shrink-0 items-center gap-0.5");
    expect(calendarSource).toContain('text-[9px] font-semibold px-1 py-0.5');
    expect(calendarSource).toContain("from-[#071a36] via-[#102f61] to-[#17427e]");
    expect(calendarSource).toContain("from-[#0b2349] to-[#17427e]");
    expect(calendarSource).toContain("bg-white/15 border border-white/35 text-white");
  });

  it("destaca voos cancelados com roxo-escuro distinto", () => {
    expect(calendarSource).toContain('cellBg = "bg-[#4B0082]";');
    expect(calendarSource).not.toContain('cellBg = "bg-slate-700";');
    expect(calendarSource).not.toContain('cellBg = "bg-slate-600";');
  });

  it("keeps long World Cup opponent names visible instead of truncating them", () => {
    expect(cupSource).toContain("min-w-0 break-words text-right");
    expect(cupSource).not.toContain(
      'text-xs font-bold text-slate-800 truncate text-right'
    );
  });
});
