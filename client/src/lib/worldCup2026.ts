/**
 * Copa do Mundo FIFA 2026 — Dados dinâmicos dos jogos do Brasil
 * Dados atualizados com resultados reais até 05/07/2026
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
    awayTeam: "Noruega",
    homeFlag: "🇧🇷",
    awayFlag: "🇳🇴",
    homeScore: 1,
    awayScore: 2,
    venue: "MetLife Stadium",
    city: "East Rutherford, NJ",
    status: "finished",
    isBrazilMatch: true,
    brazilResult: "loss",
    highlight: "❌ Eliminado nas oitavas de final",
  },
];

// Mapa de datas para lookup rápido no calendário (YYYY-MM-DD)
export const brazilMatchByDate: Record<string, WorldCupMatch> = {};

// Inicializar mapa
brazilMatches.forEach((match) => {
  brazilMatchByDate[match.date] = match;
});

// Função para obter o resultado do Brasil em uma data específica
export function getBrazilResultOnDate(date: string): WorldCupMatch | null {
  return brazilMatchByDate[date] || null;
}

// Função para obter todos os jogos de uma fase específica
export function getMatchesByPhase(phase: MatchPhase): WorldCupMatch[] {
  return brazilMatches.filter((match) => match.phase === phase);
}

// Função para obter estatísticas gerais
export function getBrazilStats() {
  const stats = {
    totalMatches: brazilMatches.length,
    wins: 0,
    draws: 0,
    losses: 0,
    goalsFor: 0,
    goalsAgainst: 0,
  };

  brazilMatches.forEach((match) => {
    if (match.brazilResult === "win") stats.wins++;
    if (match.brazilResult === "draw") stats.draws++;
    if (match.brazilResult === "loss") stats.losses++;

    if (match.homeTeam === "Brasil") {
      stats.goalsFor += match.homeScore || 0;
      stats.goalsAgainst += match.awayScore || 0;
    } else {
      stats.goalsFor += match.awayScore || 0;
      stats.goalsAgainst += match.homeScore || 0;
    }
  });

  return stats;
}
