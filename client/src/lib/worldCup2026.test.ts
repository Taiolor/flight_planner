import { describe, it, expect } from "vitest";
import {
  brazilMatches,
  brazilMatchByDate,
  getBrazilStats,
  getBrazilCurrentPhase,
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
      expect(stats.played).toBe(4);
      expect(stats.wins).toBe(3);
      expect(stats.draws).toBe(1);
      expect(stats.losses).toBe(0);

      // Points: 3 wins (9) + 1 draw (1) = 10
      expect(stats.points).toBe(10);

      // Goals For: 1 + 3 + 3 + 2 = 9
      expect(stats.goalsFor).toBe(9);

      // Goals Against: 1 + 0 + 0 + 1 = 2
      expect(stats.goalsAgainst).toBe(2);
    });

    it("should identify the correct next match", () => {
      const stats = getBrazilStats();

      // The next match in the static data should be "upcoming" or "live"
      // Which is Oitavas de Final (Brasil vs Costa do Marfim / Noruega)
      expect(stats.nextMatch).toBeDefined();
      if (stats.nextMatch) {
        expect(stats.nextMatch.id).toBe("brasil-oitavas");
        expect(stats.nextMatch.status).toBe("upcoming");
      }
    });
  });

  describe("getBrazilCurrentPhase", () => {
    it("should return the phase of the last finished match", () => {
      const phase = getBrazilCurrentPhase();

      // The last finished match in the static data is the "Rodada de 32"
      expect(phase).toBe("Rodada de 32");
    });
  });
});
