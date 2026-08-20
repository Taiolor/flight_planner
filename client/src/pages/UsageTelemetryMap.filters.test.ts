import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

describe("filtros da página Locais", () => {
  const source = readFileSync(
    resolve(process.cwd(), "client/src/pages/UsageTelemetryMap.tsx"),
    "utf8"
  );

  it("combina período e tipos de evento nas consultas administrativas", () => {
    expect(source).toContain("const [eventTypes, setEventTypes]");
    expect(source).toContain("const telemetryFilters = useMemo");
    expect(source).toContain("{ ...telemetryFilters, limit: 200 }");
    expect(source).toContain("telemetryFilters,");
  });

  it("oferece a janela completa de retenção e seleção acessível de tipos", () => {
    expect(source).toContain("[24, 72, 168, 720]");
    expect(source).toContain("30 dias");
    expect(source).toContain('aria-label="Tipos de evento"');
    expect(source).toContain("aria-pressed={eventTypes.includes(eventType)}");
    expect(source).toContain("Todos");
  });
});
