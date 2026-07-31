import { describe, it, expect } from "vitest";
import {
  brazilMatches,
  brazilMatchByDate,
  getBrazilStats,
} from "./worldCup2026";

describe("worldCup2026", () => {
  describe("brazilMatchByDate", () => {
    it("should map matches by their dates", () => {
      expect(Object.keys(brazilMatchByDate).length).toBe(brazilMatches.length);

      for (const match of brazilMatches) {
        expect(brazilMatchByDate[match.date]).toBe(match);
      }
    });

    it("should correctly lookup specific matches by date", () => {
      // 2026-06-13 is Brazil vs Morocco
      const match = brazilMatchByDate["2026-06-13"];
      expect(match).toBeDefined();
      expect(match.homeTeam).toBe("Brasil");
      expect(match.awayTeam).toBe("Marrocos");
    });
  });

  describe("getBrazilStats", () => {
    it("should calculate statistics correctly based on finished matches", () => {
      const stats = getBrazilStats();

      // Based on the static data:
      // Brasil 1-1 Marrocos (Draw)
      // Brasil 3-0 Haiti (Win)
      // Escócia 0-3 Brasil (Win)
      // Brasil 2-1 Japão (Win)
      // Brasil 1-2 Noruega (Loss)
      expect(stats.totalMatches).toBe(5);
      expect(stats.wins).toBe(3);
      expect(stats.draws).toBe(1);
      expect(stats.losses).toBe(1);

      // Goals For: 1 + 3 + 3 + 2 + 1 = 10
      expect(stats.goalsFor).toBe(10);

      // Goals Against: 1 + 0 + 0 + 1 + 2 = 4
      expect(stats.goalsAgainst).toBe(4);
    });
  });
});
