/**
 * Copa do Mundo FIFA 2026 — Dados dinâmicos dos jogos do Brasil
 * Dados atualizados com resultados reais até 29/06/2026
 */

export type MatchStatus = "finished" | "live" | "upcoming" | "tbd";
export type MatchPhase =
  | "group"
  | "round32"
  | "round16"
  | "quarterfinal"
  | "semifinal"
  | "third_place"
  | "final";

export interface WorldCupMatch {
  id: string;
  date: string; // YYYY-MM-DD
  timeLocal: string; // Horário de Brasília (BRT = UTC-3)
  phase: MatchPhase;
  phaseLabel: string;
  homeTeam: string;
  awayTeam: string;
  homeFlag: string; // emoji de bandeira
  awayFlag: string;
  homeScore: number | null;
  awayScore: number | null;
  homePenalty?: number | null;
  awayPenalty?: number | null;
  venue: string;
  city: string;
  status: MatchStatus;
  isBrazilMatch: boolean;
  brazilResult?: "win" | "draw" | "loss" | null;
  highlight?: string; // texto de destaque
}

// Todos os jogos do Brasil na Copa 2026
export const brazilMatches: WorldCupMatch[] = [
  // === FASE DE GRUPOS — GRUPO C ===
  {
    id: "brasil-marrocos",
    date: "2026-06-13",
    timeLocal: "17:00",
    phase: "group",
    phaseLabel: "Fase de Grupos — Grupo C",
    homeTeam: "Brasil",
    awayTeam: "Marrocos",
    homeFlag: "🇧🇷",
    awayFlag: "🇲🇦",
    homeScore: 1,
    awayScore: 1,
    venue: "MetLife Stadium",
    city: "East Rutherford, NJ",
    status: "finished",
    isBrazilMatch: true,
    brazilResult: "draw",
  },
  {
    id: "brasil-haiti",
    date: "2026-06-19",
    timeLocal: "22:30",
    phase: "group",
    phaseLabel: "Fase de Grupos — Grupo C",
    homeTeam: "Brasil",
    awayTeam: "Haiti",
    homeFlag: "🇧🇷",
    awayFlag: "🇭🇹",
    homeScore: 3,
    awayScore: 0,
    venue: "Lincoln Financial Field",
    city: "Filadélfia, PA",
    status: "finished",
    isBrazilMatch: true,
    brazilResult: "win",
  },
  {
    id: "escocia-brasil",
    date: "2026-06-24",
    timeLocal: "21:00",
    phase: "group",
    phaseLabel: "Fase de Grupos — Grupo C",
    homeTeam: "Escócia",
    awayTeam: "Brasil",
    homeFlag: "🏴󠁧󠁢󠁳󠁣󠁴󠁿",
    awayFlag: "🇧🇷",
    homeScore: 0,
    awayScore: 3,
    venue: "Hard Rock Stadium",
    city: "Miami Gardens, FL",
    status: "finished",
    isBrazilMatch: true,
    brazilResult: "win",
    highlight: "🏆 Brasil 1º do Grupo C",
  },

  // === RODADA DE 32 ===
  {
    id: "brasil-japao",
    date: "2026-06-29",
    timeLocal: "14:00",
    phase: "round32",
    phaseLabel: "Rodada de 32",
    homeTeam: "Brasil",
    awayTeam: "Japão",
    homeFlag: "🇧🇷",
    awayFlag: "🇯🇵",
    homeScore: 2,
    awayScore: 1,
    venue: "NRG Stadium",
    city: "Houston, TX",
    status: "finished",
    isBrazilMatch: true,
    brazilResult: "win",
    highlight: "⚡ Gol nos acréscimos!",
  },

  // === OITAVAS DE FINAL ===
  {
    id: "brasil-oitavas",
    date: "2026-07-05",
    timeLocal: "17:00",
    phase: "round16",
    phaseLabel: "Oitavas de Final",
    homeTeam: "Brasil",
    awayTeam: "Costa do Marfim / Noruega",
    homeFlag: "🇧🇷",
    awayFlag: "⚽",
    homeScore: null,
    awayScore: null,
    venue: "MetLife Stadium",
    city: "East Rutherford, NJ",
    status: "upcoming",
    isBrazilMatch: true,
    brazilResult: null,
  },

  // === QUARTAS DE FINAL (possível) ===
  {
    id: "brasil-quartas",
    date: "2026-07-09",
    timeLocal: "17:00",
    phase: "quarterfinal",
    phaseLabel: "Quartas de Final",
    homeTeam: "Brasil",
    awayTeam: "A definir",
    homeFlag: "🇧🇷",
    awayFlag: "⚽",
    homeScore: null,
    awayScore: null,
    venue: "A definir",
    city: "A definir",
    status: "tbd",
    isBrazilMatch: true,
    brazilResult: null,
  },

  // === SEMIFINAL (possível) ===
  {
    id: "brasil-semi",
    date: "2026-07-14",
    timeLocal: "16:00",
    phase: "semifinal",
    phaseLabel: "Semifinal",
    homeTeam: "Brasil",
    awayTeam: "A definir",
    homeFlag: "🇧🇷",
    awayFlag: "⚽",
    homeScore: null,
    awayScore: null,
    venue: "AT&T Stadium",
    city: "Arlington, TX",
    status: "tbd",
    isBrazilMatch: true,
    brazilResult: null,
  },

  // === FINAL ===
  {
    id: "final",
    date: "2026-07-19",
    timeLocal: "16:00",
    phase: "final",
    phaseLabel: "🏆 FINAL",
    homeTeam: "A definir",
    awayTeam: "A definir",
    homeFlag: "⚽",
    awayFlag: "⚽",
    homeScore: null,
    awayScore: null,
    venue: "MetLife Stadium",
    city: "East Rutherford, NJ",
    status: "tbd",
    isBrazilMatch: false,
    brazilResult: null,
  },
];

// Mapa de datas para lookup rápido no calendário (YYYY-MM-DD)
export const brazilMatchByDate: Record<string, WorldCupMatch> = {};
brazilMatches.forEach((m) => {
  brazilMatchByDate[m.date] = m;
});

// Estatísticas do Brasil na Copa 2026
export function getBrazilStats() {
  let played = 0;
  let wins = 0;
  let draws = 0;
  let losses = 0;
  let goalsFor = 0;
  let goalsAgainst = 0;
  let nextMatch: WorldCupMatch | undefined = undefined;

  for (const m of brazilMatches) {
    if (m.isBrazilMatch) {
      if (m.status === "finished") {
        played++;
        if (m.brazilResult === "win") wins++;
        else if (m.brazilResult === "draw") draws++;
        else if (m.brazilResult === "loss") losses++;

        const isBrazilHome = m.homeTeam === "Brasil" || m.homeTeam.includes("Brasil");
        goalsFor += isBrazilHome ? (m.homeScore ?? 0) : (m.awayScore ?? 0);
        goalsAgainst += isBrazilHome ? (m.awayScore ?? 0) : (m.homeScore ?? 0);
      } else if (!nextMatch && (m.status === "upcoming" || m.status === "live")) {
        nextMatch = m;
      }
    }
  }

  return {
    played,
    wins,
    draws,
    losses,
    goalsFor,
    goalsAgainst,
    points: wins * 3 + draws,
    nextMatch,
  };
}

// Fase atual do Brasil
export function getBrazilCurrentPhase(): string {
  const lastWin = [...brazilMatches]
    .reverse()
    .find((m) => m.isBrazilMatch && m.status === "finished");
  if (!lastWin) return "Fase de Grupos";
  const phaseOrder: Record<MatchPhase, string> = {
    group: "Fase de Grupos",
    round32: "Rodada de 32",
    round16: "Oitavas de Final",
    quarterfinal: "Quartas de Final",
    semifinal: "Semifinal",
    third_place: "3º Lugar",
    final: "Final",
  };
  return phaseOrder[lastWin.phase] ?? "Copa 2026";
}
