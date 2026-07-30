import { useMemo } from "react";
import {
  brazilMatches,
  getBrazilStats,
  type WorldCupMatch,
} from "@/lib/worldCup2026";
import { Trophy, Swords, Target, TrendingUp } from "lucide-react";

// Cores por resultado
function resultBadge(result: WorldCupMatch["brazilResult"]) {
  if (result === "win")
    return (
      <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-emerald-500 text-white">
        V
      </span>
    );
  if (result === "draw")
    return (
      <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-amber-400 text-white">
        E
      </span>
    );
  if (result === "loss")
    return (
      <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-red-500 text-white">
        D
      </span>
    );
  return null;
}

function phaseColor(phase: WorldCupMatch["phase"]) {
  switch (phase) {
    case "group":
      return "bg-blue-100 text-blue-700 border-blue-200";
    case "round32":
      return "bg-purple-100 text-purple-700 border-purple-200";
    case "round16":
      return "bg-orange-100 text-orange-700 border-orange-200";
    case "quarterfinal":
      return "bg-pink-100 text-pink-700 border-pink-200";
    case "semifinal":
      return "bg-red-100 text-red-700 border-red-200";
    case "final":
      return "bg-yellow-100 text-yellow-800 border-yellow-300";
    default:
      return "bg-slate-100 text-slate-600 border-slate-200";
  }
}

function MatchCardHeader({ match, isTbd, weekday, dateStr }: { match: WorldCupMatch, isTbd: boolean, weekday: string, dateStr: string }) {
  return (
    <div className="px-3 pt-2 pb-1 flex items-center justify-between">
      <span
        className={`text-[9px] font-semibold px-1.5 py-0.5 rounded-full border ${phaseColor(match.phase)}`}
      >
        {match.phaseLabel}
      </span>
      <div className="flex items-center gap-1 text-[9px] text-slate-400">
        <span className="capitalize">{weekday}</span>
        <span>{dateStr}</span>
        {!isTbd && (
          <span className="text-slate-500 font-medium">
            {match.timeLocal}
          </span>
        )}
      </div>
    </div>
  );
}

function MatchCardScoreboard({
  match,
  isFinished,
  isUpcoming,
  brazilScore,
  opponentScore,
  opponentTeam,
  opponentFlag
}: {
  match: WorldCupMatch,
  isFinished: boolean,
  isUpcoming: boolean,
  brazilScore: number | null,
  opponentScore: number | null,
  opponentTeam: string,
  opponentFlag: string
}) {
  return (
    <div className="px-3 pb-2 flex items-center gap-2">
      {/* Brasil */}
      <div className="flex items-center gap-1.5 flex-1 min-w-0">
        <span className="text-lg leading-none">🇧🇷</span>
        <span className="text-xs font-bold text-slate-800 truncate">
          Brasil
        </span>
      </div>

      {/* Placar central */}
      <div className="flex items-center gap-1 shrink-0">
        {isFinished ? (
          <>
            <span
              className={`text-sm font-black w-5 text-center ${match.brazilResult === "win" ? "text-emerald-600" : match.brazilResult === "loss" ? "text-red-500" : "text-amber-600"}`}
            >
              {brazilScore}
            </span>
            <span className="text-slate-400 text-xs font-bold">×</span>
            <span
              className={`text-sm font-black w-5 text-center ${match.brazilResult === "loss" ? "text-emerald-600" : match.brazilResult === "win" ? "text-red-500" : "text-amber-600"}`}
            >
              {opponentScore}
            </span>
            {resultBadge(match.brazilResult)}
          </>
        ) : isUpcoming ? (
          <span className="text-[10px] font-bold text-yellow-600 bg-yellow-100 px-2 py-0.5 rounded-full animate-pulse">
            Em breve
          </span>
        ) : (
          <span className="text-[10px] text-slate-400">A definir</span>
        )}
      </div>

      {/* Adversário */}
      <div className="flex items-center gap-1.5 flex-1 min-w-0 justify-end">
        <span className="text-xs font-bold text-slate-800 truncate text-right">
          {opponentTeam}
        </span>
        <span className="text-lg leading-none">{opponentFlag}</span>
      </div>
    </div>
  );
}

function MatchCard({ match }: { match: WorldCupMatch }) {
  const isFinished = match.status === "finished";
  const isUpcoming = match.status === "upcoming";
  const isTbd = match.status === "tbd";
  const isBrazilHome =
    match.homeTeam === "Brasil" || match.homeTeam.includes("Brasil");

  const brazilScore = isBrazilHome ? match.homeScore : match.awayScore;
  const opponentScore = isBrazilHome ? match.awayScore : match.homeScore;
  const opponentTeam = isBrazilHome ? match.awayTeam : match.homeTeam;
  const opponentFlag = isBrazilHome ? match.awayFlag : match.homeFlag;

  // Formatar data
  const dateObj = new Date(match.date + "T12:00:00");
  const dateStr = dateObj.toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
  });
  const weekday = dateObj.toLocaleDateString("pt-BR", { weekday: "short" });

  return (
    <div
      className={`
        relative rounded-xl border overflow-hidden transition-all
        ${match.isBrazilMatch && isUpcoming ? "ring-2 ring-yellow-400 shadow-lg shadow-yellow-100" : ""}
        ${match.isBrazilMatch && isFinished && match.brazilResult === "win" ? "border-emerald-200 bg-emerald-50/50" : ""}
        ${match.isBrazilMatch && isFinished && match.brazilResult === "draw" ? "border-amber-200 bg-amber-50/50" : ""}
        ${match.isBrazilMatch && isFinished && match.brazilResult === "loss" ? "border-red-200 bg-red-50/50" : ""}
        ${isTbd ? "border-slate-200 bg-slate-50/50 opacity-60" : ""}
        ${isUpcoming && match.isBrazilMatch ? "border-yellow-300 bg-yellow-50/50" : ""}
        ${!match.isBrazilMatch ? "border-slate-200 bg-white" : ""}
      `}
    >
      <MatchCardHeader
        match={match}
        isTbd={isTbd}
        weekday={weekday}
        dateStr={dateStr}
      />

      <MatchCardScoreboard
        match={match}
        isFinished={isFinished}
        isUpcoming={isUpcoming}
        brazilScore={brazilScore}
        opponentScore={opponentScore}
        opponentTeam={opponentTeam}
        opponentFlag={opponentFlag}
      />

      {/* Local */}
      {!isTbd && (
        <div className="px-3 pb-2 text-[9px] text-slate-400 truncate">
          📍 {match.venue}, {match.city}
        </div>
      )}

      {/* Destaque */}
      {match.highlight && (
        <div className="px-3 pb-2">
          <span className="text-[10px] font-semibold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-full">
            {match.highlight}
          </span>
        </div>
      )}

      {/* Próximo jogo: destaque especial */}
      {isUpcoming && match.isBrazilMatch && (
        <div className="bg-yellow-400/20 border-t border-yellow-300 px-3 py-1.5 flex items-center gap-1.5">
          <span className="text-[10px] font-bold text-yellow-700">
            ⚡ PRÓXIMO JOGO DO BRASIL
          </span>
        </div>
      )}
    </div>
  );
}

export default function BrazilWorldCupPanel() {
  const stats = useMemo(() => getBrazilStats(), []);
  const currentPhase = "Eliminado nas oitavas de final";

  // ⚡ Bolt: Separar jogos por status em uma única passagem para evitar alocações de array O(N) redundantes
  const { finishedMatches, upcomingMatches, tbdMatches } = useMemo(() => {
    const finished: WorldCupMatch[] = [];
    const upcoming: WorldCupMatch[] = [];
    const tbd: WorldCupMatch[] = [];

    for (const m of brazilMatches) {
      if (!m.isBrazilMatch) continue;

      if (m.status === "finished") {
        finished.push(m);
      } else if (m.status === "upcoming" || m.status === "live") {
        upcoming.push(m);
      } else if (m.status === "tbd") {
        tbd.push(m);
      }
    }

    return {
      finishedMatches: finished,
      upcomingMatches: upcoming,
      tbdMatches: tbd,
    };
  }, []);

  return (
    <div className="bg-white rounded-2xl border border-green-200 shadow-lg overflow-hidden">
      {/* Cabeçalho verde-amarelo */}
      <div className="bg-gradient-to-r from-green-600 via-green-500 to-yellow-400 px-4 py-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-2xl">🇧🇷</span>
            <div>
              <h2 className="text-white font-black text-sm leading-tight">
                Brasil na Copa 2026
              </h2>
              <p className="text-green-100 text-[10px]">{currentPhase}</p>
            </div>
          </div>
          <Trophy className="w-5 h-5 text-yellow-200" />
        </div>

        {/* Stats rápidas */}
        <div className="mt-2 grid grid-cols-4 gap-2">
          <div className="bg-white/20 rounded-lg px-2 py-1.5 text-center">
            <div className="text-white font-black text-base leading-none">
              {stats.totalMatches}
            </div>
            <div className="text-green-100 text-[9px] mt-0.5">Jogos</div>
          </div>
          <div className="bg-white/20 rounded-lg px-2 py-1.5 text-center">
            <div className="text-white font-black text-base leading-none">
              {stats.wins}V {stats.draws}E {stats.losses}D
            </div>
            <div className="text-green-100 text-[9px] mt-0.5">Resultado</div>
          </div>
          <div className="bg-white/20 rounded-lg px-2 py-1.5 text-center">
            <div className="text-white font-black text-base leading-none">
              {stats.goalsFor}
            </div>
            <div className="text-green-100 text-[9px] mt-0.5">Gols Pró</div>
          </div>
          <div className="bg-white/20 rounded-lg px-2 py-1.5 text-center">
            <div className="text-white font-black text-base leading-none">
              {stats.goalsAgainst}
            </div>
            <div className="text-green-100 text-[9px] mt-0.5">Gols Contra</div>
          </div>
        </div>
      </div>

      {/* Lista de jogos */}
      <div className="p-3 space-y-2 max-h-[520px] overflow-y-auto">
        {/* Próximos jogos */}
        {upcomingMatches.length > 0 && (
          <div>
            <div className="flex items-center gap-1.5 mb-1.5">
              <Target className="w-3 h-3 text-yellow-500" />
              <span className="text-[10px] font-bold text-yellow-700 uppercase tracking-wide">
                Próximos
              </span>
            </div>
            {upcomingMatches.map(m => (
              <MatchCard key={m.id} match={m} />
            ))}
          </div>
        )}

        {/* Jogos realizados */}
        {finishedMatches.length > 0 && (
          <div>
            <div className="flex items-center gap-1.5 mb-1.5 mt-2">
              <TrendingUp className="w-3 h-3 text-emerald-500" />
              <span className="text-[10px] font-bold text-emerald-700 uppercase tracking-wide">
                Realizados
              </span>
            </div>
            <div className="space-y-1.5">
              {[...finishedMatches].reverse().map(m => (
                <MatchCard key={m.id} match={m} />
              ))}
            </div>
          </div>
        )}

        {/* Fases futuras */}
        {tbdMatches.length > 0 && (
          <div>
            <div className="flex items-center gap-1.5 mb-1.5 mt-2">
              <Swords className="w-3 h-3 text-slate-400" />
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">
                Fases Futuras (se avançar)
              </span>
            </div>
            <div className="space-y-1.5">
              {tbdMatches.map(m => (
                <MatchCard key={m.id} match={m} />
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Rodapé */}
      <div className="px-4 py-2 bg-green-50 border-t border-green-100 text-[9px] text-green-600 text-center">
        Copa do Mundo FIFA 2026 • EUA, Canadá e México • Atualizado em tempo
        real
      </div>
    </div>
  );
}
