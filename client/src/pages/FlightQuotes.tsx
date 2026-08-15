/**
 * Página de Cotações de Passagens Aéreas
 * Integra Sky Scrapper API (automático) com fallback para Kayak (manual)
 * Rota fixa: GRU → NVT, ida domingo, volta sexta
 *
 * Semanas passadas: exibidas em cinza escuro (opacidade reduzida, interações desabilitadas)
 * Semana corrente e futuras: cor normal, totalmente interativas
 */

import { useState, useMemo } from "react";
import { flightData } from "@/lib/flightData";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
  Plane,
  ExternalLink,
  Trash2,
  Bot,
  Link2,
  AlertCircle,
  TrendingDown,
  ChevronDown,
  ChevronUp,
  Loader2,
  DollarSign,
  Clock,
  ArrowLeft,
} from "lucide-react";
import { Link } from "wouter";
import { useTheme } from "@/contexts/ThemeContext";

const EMPTY_ARRAY: any[] = [];

// ─── Utilitários de data ─────────────────────────────────────────────────────

/** Converte DD/MM/YYYY → YYYY-MM-DD (se já estiver em ISO, retorna sem alterar) */
const toIsoDate = (d: string): string => {
  if (d.includes("-")) return d;
  const [day, month, year] = d.split("/");
  return `${year}-${month.padStart(2, "0")}-${day.padStart(2, "0")}`;
};

/** Formata DD/MM/YYYY para exibição (ou converte ISO → BR) */
const formatDateBR = (dateStr: string): string => {
  if (!dateStr) return "";
  if (dateStr.includes("/")) return dateStr;
  const [year, month, day] = dateStr.split("-");
  return `${day}/${month}/${year}`;
};

/** Formata centavos para BRL */
const formatCurrency = (cents: number): string =>
  (cents / 100).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

/** URL padrão do Kayak para GRU → NVT */
const buildKayakUrl = (departureDate: string, returnDate: string): string => {
  const dep = toIsoDate(departureDate);
  const ret = toIsoDate(returnDate);
  return `https://www.kayak.com.br/flights/GRU-NVT/${dep}/${ret}?ucs=p1nu6v&sort=bestflight_a`;
};

/**
 * Helper para converter data DD/MM/YYYY em inteiro YYYYMMDD para comparação rápida.
 */
const dateToInt = (dateStr: string): number => {
  if (dateStr.includes("-")) {
    // ISO format: YYYY-MM-DD
    const [year, month, day] = dateStr.split("-");
    return parseInt(
      `${year}${month.padStart(2, "0")}${day.padStart(2, "0")}`,
      10
    );
  }
  // BR format: DD/MM/YYYY
  const [day, month, year] = dateStr.split("/");
  return parseInt(
    `${year}${month.padStart(2, "0")}${day.padStart(2, "0")}`,
    10
  );
};

/**
 * Determina se uma semana é passada, corrente ou futura.
 * Usa a data de IDA (domingo) como referência.
 * Considera "corrente" a semana cujo domingo de ida já passou mas o retorno (sexta) ainda não.
 */
const getWeekStatus = (
  departureDate: string,
  returnDate: string,
  todayInt?: number
): "past" | "current" | "future" => {
  if (!todayInt) {
    const today = new Date();
    const y = today.getFullYear();
    const m = String(today.getMonth() + 1).padStart(2, "0");
    const d = String(today.getDate()).padStart(2, "0");
    todayInt = parseInt(`${y}${m}${d}`, 10);
  }

  const depInt = dateToInt(departureDate);
  const retInt = dateToInt(returnDate);

  if (retInt < todayInt) return "past";
  if (depInt <= todayInt && retInt >= todayInt) return "current";
  return "future";
};

// ─── Componentes auxiliares ───────────────────────────────────────────────────

/** Badge de fonte do preço */
const SourceBadge = ({ source }: { source: "api" | "manual" }) => {
  if (source === "api") {
    return (
      <Badge className="bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 flex items-center gap-1 text-xs">
        <Bot className="w-3 h-3" />
        API Automática
      </Badge>
    );
  }
  return (
    <Badge className="bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-300 border border-blue-200 dark:border-blue-800 flex items-center gap-1 text-xs">
      <Link2 className="w-3 h-3" />
      Kayak Manual
    </Badge>
  );
};

/** Formata datetime ISO 8601 para exibição legível (ex: "07/06 às 22:05") */
const formatFlightDatetime = (iso: string | null): string => {
  if (!iso) return "";
  try {
    const d = new Date(iso);
    const day = String(d.getDate()).padStart(2, "0");
    const month = String(d.getMonth() + 1).padStart(2, "0");
    const hour = String(d.getHours()).padStart(2, "0");
    const min = String(d.getMinutes()).padStart(2, "0");
    return `${day}/${month} às ${hour}:${min}`;
  } catch {
    return iso;
  }
};

/** Linha de cotação individual */
const QuoteRow = ({
  quote,
  onDelete,
  isPast,
}: {
  quote: {
    id: number;
    lowestPrice: number;
    source: "api" | "manual";
    airline: string | null;
    outboundAirline?: string | null;
    returnAirline?: string | null;
    outboundDeparture?: string | null;
    outboundArrival?: string | null;
    returnDeparture?: string | null;
    returnArrival?: string | null;
    quotedAt: Date;
  };
  onDelete: (id: number) => void;
  isPast: boolean;
}) => {
  const quotedDate = new Date(quote.quotedAt);
  const hasFlightDetails =
    quote.outboundAirline ||
    quote.returnAirline ||
    quote.outboundDeparture ||
    quote.returnDeparture;

  return (
    <div
      className={`rounded-lg border overflow-hidden ${
        isPast
          ? "bg-slate-100 dark:bg-slate-800/60 border-slate-200 dark:border-slate-700"
          : "bg-slate-50 dark:bg-slate-700/50 border-slate-200 dark:border-slate-600"
      }`}
    >
      {/* Linha principal: preço + fonte + data da cotação + botão excluir */}
      <div className="flex items-center justify-between py-2 px-3 gap-2">
        <div className="flex items-center gap-3 flex-1 min-w-0">
          <span
            className={`text-lg font-bold whitespace-nowrap ${
              isPast
                ? "text-slate-400 dark:text-slate-500"
                : "text-slate-800 dark:text-slate-100"
            }`}
          >
            {formatCurrency(quote.lowestPrice)}
          </span>
          <SourceBadge source={quote.source} />
          {/* Exibir companhia legada se não houver dados detalhados */}
          {!hasFlightDetails && quote.airline && (
            <span className="text-xs text-slate-500 dark:text-slate-400 truncate">
              {quote.airline}
            </span>
          )}
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          <span className="text-xs text-slate-400 dark:text-slate-500 hidden sm:block">
            {quotedDate.toLocaleDateString("pt-BR", {
              day: "2-digit",
              month: "2-digit",
              hour: "2-digit",
              minute: "2-digit",
            })}
          </span>
          <AlertDialog>
            <Tooltip>
              <TooltipTrigger asChild>
                <AlertDialogTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    type="button"
                    className="h-6 w-6 text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:text-red-400 dark:hover:bg-red-950/30 transition-colors focus-visible:ring-2 focus-visible:ring-red-500"
                    aria-label={`Excluir cotação ${quote.id}`}
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </Button>
                </AlertDialogTrigger>
              </TooltipTrigger>
              <TooltipContent>Excluir cotação</TooltipContent>
            </Tooltip>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Excluir cotação</AlertDialogTitle>
                <AlertDialogDescription>
                  Tem certeza que deseja excluir esta cotação de{" "}
                  {formatCurrency(quote.lowestPrice)}? Esta ação não pode ser
                  desfeita.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancelar</AlertDialogCancel>
                <AlertDialogAction
                  onClick={() => onDelete(quote.id)}
                  className="bg-red-600 hover:bg-red-700 text-white"
                >
                  Excluir
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </div>

      {/* Detalhes de ida e volta (apenas quando disponível via API) */}
      {hasFlightDetails && (
        <div
          className={`px-3 pb-2.5 pt-0 border-t grid grid-cols-2 gap-2 ${
            isPast
              ? "border-slate-200 dark:border-slate-700"
              : "border-slate-200 dark:border-slate-600"
          }`}
        >
          {/* Voo de Ida */}
          <div
            className={`rounded-md p-2 ${
              isPast
                ? "bg-slate-200/60 dark:bg-slate-700/40"
                : "bg-white dark:bg-slate-800/60"
            }`}
          >
            <p className="text-[10px] font-semibold uppercase tracking-wider text-emerald-600 dark:text-emerald-400 mb-1 flex items-center gap-1">
              <Plane className="w-3 h-3" />
              Ida
            </p>
            {quote.outboundAirline && (
              <p
                className={`text-xs font-medium truncate ${
                  isPast
                    ? "text-slate-400 dark:text-slate-500"
                    : "text-slate-700 dark:text-slate-200"
                }`}
              >
                {quote.outboundAirline}
              </p>
            )}
            {quote.outboundDeparture && (
              <p
                className={`text-xs flex items-center gap-1 mt-0.5 ${
                  isPast
                    ? "text-slate-400 dark:text-slate-500"
                    : "text-slate-500 dark:text-slate-400"
                }`}
              >
                <Clock className="w-3 h-3 flex-shrink-0" />
                Partida: {formatFlightDatetime(quote.outboundDeparture)}
              </p>
            )}
            {quote.outboundArrival && (
              <p
                className={`text-xs flex items-center gap-1 ${
                  isPast
                    ? "text-slate-400 dark:text-slate-500"
                    : "text-slate-500 dark:text-slate-400"
                }`}
              >
                <Clock className="w-3 h-3 flex-shrink-0" />
                Chegada: {formatFlightDatetime(quote.outboundArrival)}
              </p>
            )}
          </div>

          {/* Voo de Volta */}
          <div
            className={`rounded-md p-2 ${
              isPast
                ? "bg-slate-200/60 dark:bg-slate-700/40"
                : "bg-white dark:bg-slate-800/60"
            }`}
          >
            <p className="text-[10px] font-semibold uppercase tracking-wider text-blue-600 dark:text-blue-400 mb-1 flex items-center gap-1">
              <Plane className="w-3 h-3 rotate-180" />
              Volta
            </p>
            {quote.returnAirline && (
              <p
                className={`text-xs font-medium truncate ${
                  isPast
                    ? "text-slate-400 dark:text-slate-500"
                    : "text-slate-700 dark:text-slate-200"
                }`}
              >
                {quote.returnAirline}
              </p>
            )}
            {quote.returnDeparture && (
              <p
                className={`text-xs flex items-center gap-1 mt-0.5 ${
                  isPast
                    ? "text-slate-400 dark:text-slate-500"
                    : "text-slate-500 dark:text-slate-400"
                }`}
              >
                <Clock className="w-3 h-3 flex-shrink-0" />
                Partida: {formatFlightDatetime(quote.returnDeparture)}
              </p>
            )}
            {quote.returnArrival && (
              <p
                className={`text-xs flex items-center gap-1 ${
                  isPast
                    ? "text-slate-400 dark:text-slate-500"
                    : "text-slate-500 dark:text-slate-400"
                }`}
              >
                <Clock className="w-3 h-3 flex-shrink-0" />
                Chegada: {formatFlightDatetime(quote.returnArrival)}
              </p>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

/** Card de semana — aparência e interatividade variam conforme status */
const WeekCard = ({
  week,
  quotes,
  apiUsage,
  onFetchApi,
  onSaveManual,
  onDelete,
  isLoadingApi,
  todayInt,
}: {
  week: { semana: number; ida: { data: string }; retorno: { data: string } };
  quotes: Array<{
    id: number;
    lowestPrice: number;
    source: "api" | "manual";
    airline: string | null;
    quotedAt: Date;
  }>;
  apiUsage: { requestsUsed: number; requestsLimit: number };
  onFetchApi: (
    weekNumber: number,
    departureDate: string,
    returnDate: string
  ) => void;
  onSaveManual: (
    weekNumber: number,
    departureDate: string,
    returnDate: string,
    price: number,
    details?: {
      outboundAirline?: string;
      returnAirline?: string;
      outboundDeparture?: string;
      returnDeparture?: string;
    }
  ) => void;
  onDelete: (id: number) => void;
  isLoadingApi: boolean;
  todayInt: number;
}) => {
  const [expanded, setExpanded] = useState(false);
  const [showManualDetails, setShowManualDetails] = useState(false);
  const [manualPrice, setManualPrice] = useState("");
  const [outboundAirline, setOutboundAirline] = useState("");
  const [returnAirline, setReturnAirline] = useState("");
  const [outboundDeparture, setOutboundDeparture] = useState("");
  const [returnDeparture, setReturnDeparture] = useState("");

  const depIso = toIsoDate(week.ida.data);
  const retIso = toIsoDate(week.retorno.data);
  const kayakUrl = buildKayakUrl(week.ida.data, week.retorno.data);
  const apiLimitReached = apiUsage.requestsUsed >= apiUsage.requestsLimit;

  const status = getWeekStatus(week.ida.data, week.retorno.data, todayInt);
  const isPast = status === "past";
  const isCurrent = status === "current";

  // ⚡ Bolt Optimization: Memoize the lowestQuote calculation to prevent O(N) array reduction
  // from running on every render of the WeekCard component. This is particularly beneficial
  // because WeekCard is rendered in a list, multiplying the savings across all weeks.
  const lowestQuote = useMemo(() => {
    return quotes.length > 0
      ? quotes.reduce((min, q) => (q.lowestPrice < min.lowestPrice ? q : min))
      : null;
  }, [quotes]);

  const handleSaveManual = () => {
    const price = parseFloat(manualPrice.replace(",", "."));
    if (isNaN(price) || price <= 0) {
      toast.error("Informe um preço válido (ex: 350.90)");
      return;
    }

    const details = showManualDetails
      ? {
          outboundAirline: outboundAirline || undefined,
          returnAirline: returnAirline || undefined,
          outboundDeparture: outboundDeparture || undefined,
          returnDeparture: returnDeparture || undefined,
        }
      : undefined;

    onSaveManual(week.semana, depIso, retIso, price, details);
    setManualPrice("");
    setOutboundAirline("");
    setReturnAirline("");
    setOutboundDeparture("");
    setReturnDeparture("");
    setShowManualDetails(false);
  };

  // ── Estilos condicionais por status ──────────────────────────────────────
  const cardBg = isPast
    ? "bg-slate-100 dark:bg-slate-800/40 border-slate-200 dark:border-slate-700/60"
    : isCurrent
      ? "bg-white dark:bg-slate-800 border-blue-300 dark:border-blue-600 ring-1 ring-blue-200 dark:ring-blue-700"
      : "bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700";

  const headerHover = isPast
    ? "hover:bg-slate-200/60 dark:hover:bg-slate-700/30"
    : "hover:bg-slate-50 dark:hover:bg-slate-700/50";

  const weekNumBg = isPast
    ? "bg-slate-200 dark:bg-slate-700/60"
    : isCurrent
      ? "bg-blue-100 dark:bg-blue-900/40"
      : "bg-slate-100 dark:bg-slate-700";

  const weekNumText = isPast
    ? "text-slate-400 dark:text-slate-500"
    : isCurrent
      ? "text-blue-700 dark:text-blue-300"
      : "text-slate-800 dark:text-slate-100";

  const weekLabelText = isPast
    ? "text-slate-400 dark:text-slate-500"
    : isCurrent
      ? "text-blue-600 dark:text-blue-400"
      : "text-slate-500 dark:text-slate-400";

  const dateTextDep = isPast
    ? "text-slate-400 dark:text-slate-500"
    : "text-blue-600 dark:text-blue-400";

  const dateTextRet = isPast
    ? "text-slate-400 dark:text-slate-500"
    : "text-orange-600 dark:text-orange-400";

  const arrowText = isPast
    ? "text-slate-300 dark:text-slate-600"
    : "text-slate-400 dark:text-slate-500";

  return (
    <div
      className={`rounded-xl border shadow-sm overflow-hidden transition-all duration-200 ${cardBg} ${
        isPast ? "opacity-60" : ""
      }`}
    >
      {/* Header do card */}
      <button
        type="button"
        onClick={() => setExpanded(!expanded)}
        className={`w-full flex items-center justify-between px-4 py-3 transition-colors focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-inset ${headerHover}`}
        aria-expanded={expanded}
        aria-label={
          expanded
            ? `Recolher detalhes da semana ${week.semana}`
            : `Expandir detalhes da semana ${week.semana}`
        }
        aria-controls={`quote-content-${week.semana}`}
      >
        <div className="flex items-center gap-3">
          {/* Badge de número da semana */}
          <div
            className={`flex items-center gap-1.5 rounded-lg px-2.5 py-1 ${weekNumBg}`}
          >
            <span
              className={`text-xs font-bold uppercase tracking-wider ${weekLabelText}`}
            >
              Sem.
            </span>
            <span className={`text-sm font-bold ${weekNumText}`}>
              {week.semana}
            </span>
            {isCurrent && (
              <span className="ml-0.5 text-[10px] font-semibold text-blue-600 dark:text-blue-400 uppercase tracking-wide">
                ● atual
              </span>
            )}
          </div>

          {/* Datas e menor preço */}
          <div className="text-left">
            <div className="text-sm font-medium">
              <span className={dateTextDep}>
                ✈ {formatDateBR(week.ida.data)}
              </span>
              <span className={`mx-1.5 ${arrowText}`}>→</span>
              <span className={dateTextRet}>
                ↩ {formatDateBR(week.retorno.data)}
              </span>
            </div>
            {lowestQuote ? (
              <div className="flex items-center gap-1.5 mt-0.5">
                <TrendingDown
                  className={`w-3 h-3 ${isPast ? "text-slate-400" : "text-emerald-500"}`}
                />
                <span
                  className={`text-xs font-semibold ${
                    isPast
                      ? "text-slate-400 dark:text-slate-500"
                      : "text-emerald-600 dark:text-emerald-400"
                  }`}
                >
                  {formatCurrency(lowestQuote.lowestPrice)}
                </span>
                <SourceBadge source={lowestQuote.source} />
              </div>
            ) : isPast ? (
              <span className="text-[11px] text-slate-400 dark:text-slate-500 italic">
                sem cotação registrada
              </span>
            ) : null}
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Indicador visual de passado */}
          {isPast && (
            <span className="hidden sm:flex items-center gap-1 text-[11px] text-slate-400 dark:text-slate-500">
              <Clock className="w-3 h-3" />
              passado
            </span>
          )}
          {quotes.length > 0 && (
            <Badge
              variant="secondary"
              className={`text-xs ${isPast ? "opacity-60" : ""}`}
            >
              {quotes.length} cotação{quotes.length !== 1 ? "ões" : ""}
            </Badge>
          )}
          {expanded ? (
            <ChevronUp
              className={`w-4 h-4 ${isPast ? "text-slate-300 dark:text-slate-600" : "text-slate-400"}`}
            />
          ) : (
            <ChevronDown
              className={`w-4 h-4 ${isPast ? "text-slate-300 dark:text-slate-600" : "text-slate-400"}`}
            />
          )}
        </div>
      </button>

      {/* Conteúdo expandido */}
      {expanded && (
        <div
          id={`quote-content-${week.semana}`}
          className={`border-t px-4 py-4 space-y-4 ${
            isPast
              ? "border-slate-200 dark:border-slate-700/60"
              : "border-slate-200 dark:border-slate-700"
          }`}
        >
          {/* Aviso de semana passada */}
          {isPast && (
            <div className="flex items-start gap-2 p-3 rounded-lg bg-slate-100 dark:bg-slate-700/40 border border-slate-200 dark:border-slate-700">
              <Clock className="w-4 h-4 text-slate-400 dark:text-slate-500 flex-shrink-0 mt-0.5" />
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Esta semana já passou. As cotações salvas são mantidas apenas
                para consulta histórica. Novos preços não podem ser buscados
                para datas passadas.
              </p>
            </div>
          )}

          {/* Botões de ação — apenas para semanas presentes/futuras */}
          {!isPast && (
            <div className="flex flex-wrap gap-2">
              {/* Botão API */}
              <Tooltip>
                <TooltipTrigger asChild>
                  <span
                    tabIndex={0}
                    className="inline-block rounded-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500"
                  >
                    <Button
                      size="sm"
                      onClick={() => onFetchApi(week.semana, depIso, retIso)}
                      disabled={isLoadingApi || apiLimitReached}
                      className={`flex items-center gap-1.5 text-xs ${
                        apiLimitReached
                          ? "bg-slate-300 dark:bg-slate-600 cursor-not-allowed"
                          : "bg-emerald-600 hover:bg-emerald-700 text-white"
                      }`}
                    >
                      {isLoadingApi ? (
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      ) : (
                        <Bot className="w-3.5 h-3.5" />
                      )}
                      {isLoadingApi ? "Buscando..." : "Buscar via API"}
                    </Button>
                  </span>
                </TooltipTrigger>
                <TooltipContent>
                  {apiLimitReached
                    ? "Limite mensal atingido — use o Kayak"
                    : "Buscar preço via Sky Scrapper API"}
                </TooltipContent>
              </Tooltip>

              {/* Botão Kayak */}
              <a
                href={kayakUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-md bg-blue-600 hover:bg-blue-700 text-white transition-colors focus-visible:ring-2 focus-visible:ring-blue-500"
              >
                <ExternalLink className="w-3.5 h-3.5" />
                Abrir Kayak
              </a>
            </div>
          )}

          {/* Aviso de limite atingido */}
          {!isPast && apiLimitReached && (
            <div className="flex items-start gap-2 p-3 rounded-lg bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800">
              <AlertCircle className="w-4 h-4 text-amber-600 dark:text-amber-400 flex-shrink-0 mt-0.5" />
              <p className="text-xs text-amber-700 dark:text-amber-300">
                <strong>Limite mensal atingido</strong> ({apiUsage.requestsUsed}
                /{apiUsage.requestsLimit} requisições). Use o botão{" "}
                <strong>Abrir Kayak</strong> para consultar o preço e insira
                manualmente abaixo.
              </p>
            </div>
          )}

          {/* Campo de preço manual — apenas para semanas presentes/futuras */}
          {!isPast && (
            <div className="space-y-2">
              <label
                htmlFor={`manual-price-${week.semana}`}
                className="text-xs font-semibold text-slate-600 dark:text-slate-300 flex items-center gap-1.5"
              >
                <DollarSign className="w-3.5 h-3.5" />
                Inserir preço manualmente (R$)
              </label>
              <div className="flex gap-2">
                <Input
                  id={`manual-price-${week.semana}`}
                  type="number"
                  min="0"
                  step="0.01"
                  placeholder="Ex: 350.90"
                  value={manualPrice}
                  onChange={e => setManualPrice(e.target.value)}
                  className="h-8 text-sm dark:bg-slate-700 dark:border-slate-600 dark:text-slate-100 dark:placeholder-slate-400 max-w-[160px]"
                  onKeyDown={e => e.key === "Enter" && handleSaveManual()}
                />
                <Button
                  size="sm"
                  onClick={handleSaveManual}
                  disabled={!manualPrice}
                  className="h-8 text-xs bg-blue-600 hover:bg-blue-700 text-white"
                >
                  <Link2 className="w-3.5 h-3.5 mr-1" />
                  Salvar
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowManualDetails(!showManualDetails)}
                  className="h-8 text-xs border-slate-200 dark:border-slate-600"
                  aria-expanded={showManualDetails}
                  aria-controls={`manual-details-${week.semana}`}
                  aria-label={
                    showManualDetails
                      ? `Ocultar detalhes da inserção manual da semana ${week.semana}`
                      : `Mostrar detalhes da inserção manual da semana ${week.semana}`
                  }
                >
                  {showManualDetails ? "Menos detalhes" : "Mais detalhes"}
                </Button>
              </div>

              {showManualDetails && (
                <div
                  id={`manual-details-${week.semana}`}
                  className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-3 rounded-lg bg-slate-50 dark:bg-slate-700/30 border border-slate-200 dark:border-slate-600 mt-2 animate-in fade-in slide-in-from-top-1 duration-200"
                >
                  <div className="space-y-1.5">
                    <label
                      htmlFor={`outbound-airline-${week.semana}`}
                      className="text-[10px] font-bold uppercase text-slate-500 dark:text-slate-400"
                    >
                      Cia Aérea Ida
                    </label>
                    <Input
                      id={`outbound-airline-${week.semana}`}
                      placeholder="Ex: LATAM"
                      value={outboundAirline}
                      onChange={e => setOutboundAirline(e.target.value)}
                      className="h-8 text-xs dark:bg-slate-800"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label
                      htmlFor={`return-airline-${week.semana}`}
                      className="text-[10px] font-bold uppercase text-slate-500 dark:text-slate-400"
                    >
                      Cia Aérea Volta
                    </label>
                    <Input
                      id={`return-airline-${week.semana}`}
                      placeholder="Ex: GOL"
                      value={returnAirline}
                      onChange={e => setReturnAirline(e.target.value)}
                      className="h-8 text-xs dark:bg-slate-800"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label
                      htmlFor={`outbound-departure-${week.semana}`}
                      className="text-[10px] font-bold uppercase text-slate-500 dark:text-slate-400"
                    >
                      Partida Ida
                    </label>
                    <Input
                      id={`outbound-departure-${week.semana}`}
                      type="datetime-local"
                      value={outboundDeparture}
                      onChange={e => setOutboundDeparture(e.target.value)}
                      className="h-8 text-xs dark:bg-slate-800"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label
                      htmlFor={`return-departure-${week.semana}`}
                      className="text-[10px] font-bold uppercase text-slate-500 dark:text-slate-400"
                    >
                      Partida Volta
                    </label>
                    <Input
                      id={`return-departure-${week.semana}`}
                      type="datetime-local"
                      value={returnDeparture}
                      onChange={e => setReturnDeparture(e.target.value)}
                      className="h-8 text-xs dark:bg-slate-800"
                    />
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Lista de cotações salvas */}
          {quotes.length > 0 && (
            <div className="space-y-2">
              <p
                className={`text-xs font-semibold uppercase tracking-wider ${
                  isPast
                    ? "text-slate-400 dark:text-slate-500"
                    : "text-slate-500 dark:text-slate-400"
                }`}
              >
                Cotações salvas
              </p>
              <div className="space-y-1.5">
                {quotes.map(q => (
                  <QuoteRow
                    key={q.id}
                    quote={q}
                    onDelete={onDelete}
                    isPast={isPast}
                  />
                ))}
              </div>
            </div>
          )}

          {quotes.length === 0 && !isPast && (
            <p className="text-xs text-slate-400 dark:text-slate-500 italic text-center py-2">
              Nenhuma cotação salva ainda. Use os botões acima para buscar
              preços.
            </p>
          )}
        </div>
      )}
    </div>
  );
};

// ─── Componente principal ─────────────────────────────────────────────────────

export default function FlightQuotes() {
  const { theme } = useTheme();
  const _isDark = theme === "dark";
  const [loadingWeek, setLoadingWeek] = useState<number | null>(null);

  // Queries
  const { data: allQuotes = EMPTY_ARRAY, refetch: refetchQuotes } =
    trpc.quotes.getAll.useQuery();
  const {
    data: apiUsage = { requestsUsed: 0, requestsLimit: 20 },
    refetch: refetchUsage,
  } = trpc.quotes.getApiUsage.useQuery();

  // Mutations
  const fetchFromApi = trpc.quotes.fetchFromApi.useMutation({
    onSuccess: data => {
      toast.success(
        `Preço encontrado: ${data.lowestPriceFormatted}${data.airline ? ` (${data.airline})` : ""}`,
        {
          description: `Requisições usadas: ${data.requestsUsed}/${data.requestsLimit}`,
        }
      );
      refetchQuotes();
      refetchUsage();
      setLoadingWeek(null);
    },
    onError: err => {
      toast.error("Erro ao buscar preço via API", { description: err.message });
      setLoadingWeek(null);
    },
  });

  const saveManual = trpc.quotes.saveManual.useMutation({
    onSuccess: data => {
      toast.success(`Preço salvo: ${data.lowestPriceFormatted}`);
      refetchQuotes();
    },
    onError: err => {
      toast.error("Erro ao salvar preço", { description: err.message });
    },
  });

  const deleteQuote = trpc.quotes.delete.useMutation({
    onSuccess: () => {
      toast.success("Cotação excluída");
      refetchQuotes();
    },
    onError: err => {
      toast.error("Erro ao excluir cotação", { description: err.message });
    },
  });

  // Agrupar cotações por semana
  const quotesByWeek = useMemo(() => {
    const map: Record<number, typeof allQuotes> = {};
    for (const q of allQuotes) {
      if (!map[q.weekNumber]) map[q.weekNumber] = [];
      map[q.weekNumber].push(q);
    }
    return map;
  }, [allQuotes]);

  const handleFetchApi = (
    weekNumber: number,
    departureDate: string,
    returnDate: string
  ) => {
    setLoadingWeek(weekNumber);
    fetchFromApi.mutate({ weekNumber, departureDate, returnDate });
  };

  const handleSaveManual = (
    weekNumber: number,
    departureDate: string,
    returnDate: string,
    price: number,
    details?: {
      outboundAirline?: string;
      returnAirline?: string;
      outboundDeparture?: string;
      returnDeparture?: string;
    }
  ) => {
    saveManual.mutate({
      weekNumber,
      departureDate,
      returnDate,
      price,
      ...details,
    });
  };

  const handleDelete = (id: number) => {
    deleteQuote.mutate({ id });
  };

  const usagePercent = Math.round(
    (apiUsage.requestsUsed / apiUsage.requestsLimit) * 100
  );
  const usageColor =
    usagePercent >= 90
      ? "bg-red-500"
      : usagePercent >= 70
        ? "bg-amber-500"
        : "bg-emerald-500";

  // ⚡ Bolt: Pre-calculate todayInt once per render to avoid calling new Date()
  // and performing string allocations multiple times in child components.
  const todayInt = useMemo(() => {
    const today = new Date();
    const y = today.getFullYear();
    const m = String(today.getMonth() + 1).padStart(2, "0");
    const d = String(today.getDate()).padStart(2, "0");
    return parseInt(`${y}${m}${d}`, 10);
  }, []);

  // Contar semanas por status para exibir no header
  const weekCounts = useMemo(() => {
    let past = 0,
      current = 0,
      future = 0;

    for (const w of flightData) {
      const s = getWeekStatus(w.ida.data, w.retorno.data, todayInt);
      if (s === "past") past++;
      else if (s === "current") current++;
      else future++;
    }
    return { past, current, future };
  }, [todayInt]);

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900 transition-colors duration-300">
      {/* Cabeçalho com botão voltar */}
      <header className="bg-gradient-to-r from-blue-600 via-purple-600 to-cyan-500 text-white px-4 py-3 flex items-center gap-3 shadow-lg sticky top-0 z-10">
        <Link href="/">
          <button className="flex items-center gap-1.5 text-white/80 hover:text-white transition-colors text-sm font-medium focus:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-blue-700 rounded-sm">
            <ArrowLeft className="w-4 h-4" />
            Voltar
          </button>
        </Link>
        <div className="flex items-center gap-2 ml-2">
          <Plane className="w-5 h-5" />
          <h1 className="text-base font-bold tracking-wide">
            Cotações de Passagens
          </h1>
        </div>
      </header>

      {/* Header da página */}
      <div className="bg-white dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 px-4 py-4 mb-6">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-start justify-between gap-4 flex-wrap">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <Plane className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                <h1 className="text-xl font-bold text-slate-800 dark:text-slate-100">
                  Cotações de Passagens
                </h1>
              </div>
              <p className="text-sm text-slate-500 dark:text-slate-400">
                GRU (Guarulhos) → NVT (Navegantes) · Ida: domingo · Volta: sexta
              </p>
              {/* Resumo de semanas */}
              <div className="flex items-center gap-3 mt-2 flex-wrap">
                {weekCounts.current > 0 && (
                  <span className="inline-flex items-center gap-1 text-xs font-medium text-blue-700 dark:text-blue-300 bg-blue-50 dark:bg-blue-900/30 border border-blue-200 dark:border-blue-700 rounded-full px-2 py-0.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-blue-500 inline-block" />
                    {weekCounts.current} semana atual
                  </span>
                )}
                <span className="inline-flex items-center gap-1 text-xs font-medium text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-900/30 border border-emerald-200 dark:border-emerald-700 rounded-full px-2 py-0.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 inline-block" />
                  {weekCounts.future} semanas futuras
                </span>
                <span className="inline-flex items-center gap-1 text-xs font-medium text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-700/50 border border-slate-200 dark:border-slate-600 rounded-full px-2 py-0.5">
                  <Clock className="w-3 h-3" />
                  {weekCounts.past} semanas passadas
                </span>
              </div>
            </div>

            {/* Contador de uso da API */}
            <div className="flex flex-col items-end gap-1 min-w-[180px]">
              <div className="flex items-center gap-2">
                <Bot className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                <span className="text-sm font-semibold text-slate-700 dark:text-slate-200">
                  API Sky Scrapper
                </span>
              </div>
              <div className="w-full bg-slate-200 dark:bg-slate-700 rounded-full h-2">
                <div
                  className={`h-2 rounded-full transition-all duration-500 ${usageColor}`}
                  style={{ width: `${Math.min(usagePercent, 100)}%` }}
                />
              </div>
              <span className="text-xs text-slate-500 dark:text-slate-400">
                {apiUsage.requestsUsed}/{apiUsage.requestsLimit} requisições
                usadas este mês
              </span>
              {apiUsage.requestsUsed >= apiUsage.requestsLimit && (
                <Badge className="bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300 border border-red-200 dark:border-red-800 text-xs">
                  <AlertCircle className="w-3 h-3 mr-1" />
                  Limite atingido — use Kayak
                </Badge>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Lista de semanas */}
      <div className="max-w-4xl mx-auto px-4 pb-8">
        {/* Legenda */}
        <div className="flex items-center gap-4 mb-4 flex-wrap">
          <div className="flex items-center gap-1.5">
            <Bot className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
            <span className="text-xs text-slate-600 dark:text-slate-400">
              <strong>API Automática</strong> — Sky Scrapper (RapidAPI)
            </span>
          </div>
          <div className="flex items-center gap-1.5">
            <Link2 className="w-4 h-4 text-blue-600 dark:text-blue-400" />
            <span className="text-xs text-slate-600 dark:text-slate-400">
              <strong>Kayak Manual</strong> — preço inserido manualmente
            </span>
          </div>
          <div className="flex items-center gap-1.5">
            <Clock className="w-4 h-4 text-slate-400" />
            <span className="text-xs text-slate-500 dark:text-slate-400">
              <strong>Cinza</strong> — semana já passou
            </span>
          </div>
        </div>

        <div className="space-y-3">
          {flightData.map(week => (
            <WeekCard
              key={week.semana}
              week={week}
              quotes={quotesByWeek[week.semana] ?? EMPTY_ARRAY}
              apiUsage={apiUsage}
              onFetchApi={handleFetchApi}
              onSaveManual={handleSaveManual}
              onDelete={handleDelete}
              isLoadingApi={loadingWeek === week.semana}
              todayInt={todayInt}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
