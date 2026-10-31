/**
 * Testes unitários para o parser e detector de commits do Dashboard Google Jules (server/routers/jules.ts)
 */
import { describe, it, expect } from "vitest";
import {
  JULES_AGENTS,
  parseJulesJournal,
  detectAgentFromCommit,
} from "./routers/jules";

describe("julesRouter utilities", () => {
  describe("parseJulesJournal", () => {
    it("deve extrair entradas de aprendizado e ação de um diário Markdown", () => {
      const sampleMd = `
## 2026-09-11 - Resolving N+1 Database Queries via Batching
**Learning:** Pre-allocating an array eliminates sequential I/O overhead.
**Action:** Use a single batched write operation.

## 2026-10-31 - Hoist Intl.NumberFormat Singletons
**Learning:** Constructing Intl.NumberFormat inside render helpers is expensive.
**Action:** Hoist formatters to module-level constants.
`;
      const boltAgent = JULES_AGENTS[0];
      const entries = parseJulesJournal(sampleMd, boltAgent);

      expect(entries).toHaveLength(2);
      // Mais recente primeiro
      expect(entries[0].date).toBe("2026-10-31");
      expect(entries[0].title).toBe("Hoist Intl.NumberFormat Singletons");
      expect(entries[0].learning).toContain("Intl.NumberFormat");
      expect(entries[0].action).toContain("module-level constants");
      expect(entries[1].date).toBe("2026-09-11");
    });

    it("deve extrair Vulnerability e Prevention em entradas do Sentinel", () => {
      const sentinelMd = `
## 2026-10-31 - [Enforce Bounds on Quotes Router Inputs]
**Vulnerability:** Unbounded string and numeric inputs.
**Learning:** Bare z.string() allows oversized payloads.
**Prevention:** Pair z.string() with explicit .max() constraints.
`;
      const sentinelAgent = JULES_AGENTS[1];
      const entries = parseJulesJournal(sentinelMd, sentinelAgent);

      expect(entries).toHaveLength(1);
      expect(entries[0].title).toBe("Enforce Bounds on Quotes Router Inputs");
      expect(entries[0].vulnerability).toBe(
        "Unbounded string and numeric inputs."
      );
      expect(entries[0].action).toBe(
        "Pair z.string() with explicit .max() constraints."
      );
    });
  });

  describe("detectAgentFromCommit", () => {
    it("deve identificar cada um dos 5 agentes pelo prefixo ou branch de PR", () => {
      expect(
        detectAgentFromCommit("⚡ Bolt: Optimize filteredWeeks")?.id
      ).toBe("bolt");
      expect(
        detectAgentFromCommit(
          "Merge pull request #359 from Taiolor/sentinel-fix-dos-limits"
        )?.id
      ).toBe("sentinel");
      expect(
        detectAgentFromCommit("🎨 Palette: Improve accessibility")?.id
      ).toBe("palette");
      expect(
        detectAgentFromCommit("🧪 Radar: Add unit tests for financialDb")?.id
      ).toBe("radar");
      expect(
        detectAgentFromCommit("🧹 Janitor: Remove duplicate extractTime")?.id
      ).toBe("janitor");
      expect(detectAgentFromCommit("chore: update dependencies")).toBeNull();
    });
  });
});
