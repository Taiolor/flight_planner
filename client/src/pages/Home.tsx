import React, {
  lazy,
  Suspense,
  useState,
  useMemo,
  useEffect,
  useCallback,
  useRef,
} from "react";
import type { FlightPrice, PublicPrice } from "../../../drizzle/schema";
import { toast } from "sonner";
import {
  flightData,
  airlines,
  departureAirports,
  generateBookingLink,
  DepartureAirport,
  getFeriadosDaSemana,
  getFeriadosPorIntervalo,
  FeriadoInfo,
} from "@/lib/flightData";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { MetricCard } from "@/components/MetricCard";
import { AIRLINE_LOGO_ASSETS } from "@/lib/airlineAssets";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
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
  ChevronDown,
  ChevronUp,
  Plane,
  Calendar,
  Clock,
  ExternalLink,
  AlertCircle,
  Trash2,
  CheckCircle2,
  Circle,
  RotateCcw,
  SlidersHorizontal,
  Loader2,
  TrendingUp,
  Lock,
  LogOut,
  LogIn,
  Eye,
  EyeOff,
  CalendarPlus,
  Download,
  Radar,
  RotateCw,
  Bell,
  BellOff,
  BellRing,
  Sparkles,
  Wand2,
  CalendarDays,
  ShieldCheck,
  MapPinned,
  Sun,
  Moon,
  DollarSign,
  MapPin,
  BarChart2,
  WifiOff,
} from "lucide-react";
import { Link } from "wouter";
import { ShareByEmailButton } from "@/components/ShareByEmailButton";
import { AdditionalFlightHeaderAction } from "@/components/AdditionalFlightHeaderAction";
import {
  getGoogleCalendarLink,
  getOutlookLink,
  downloadICS,
  airportNames,
  airportAddresses,
  airlineNames,
  airlineIataCodes,
  buildFlightTrackUrl,
  buildWhatsAppShareUrl,
  CalendarEventParams,
  LEAD_OPTIONS,
  DURATION_OPTIONS,
} from "@/lib/calendarHelper";
import { usePullToRefresh } from "@/hooks/usePullToRefresh";
import { usePushNotifications } from "@/hooks/usePushNotifications";
import { DeferredPdfExportButton } from "@/components/DeferredPdfExportButton";
import { SkeletonFilters } from "@/components/SkeletonFilters";
import { SkeletonChart } from "@/components/SkeletonChart";
import { HomeInitialLoadingSkeleton } from "@/components/HomeInitialLoadingSkeleton";
import { ContentReveal } from "@/components/ContentReveal";
import { NotificationSettingsPopup } from "@/components/NotificationSettingsPopup";
import { PwaInstallGuide } from "@/components/PwaInstallGuide";
import { trpc } from "@/lib/trpc";
import { LoginModal } from "@/components/auth/LoginModal";
import { useTheme, COLOR_PRESETS } from "@/contexts/ThemeContext";
import type { ColorPreset } from "@/contexts/ThemeContext";
import { AVAILABLE_PLANNING_YEARS, useYear } from "@/contexts/YearContext";
import { GlobalYearSelector } from "@/components/GlobalYearSelector";
import { AdditionalFlightsPanel, type AdditionalFlightRecord } from "@/components/AdditionalFlightsPanel";
import { AttentionCenter } from "@/components/AttentionCenter";
import { AnnualPlanningProgress } from "@/components/AnnualPlanningProgress";
import { HomeHeaderActions } from "@/components/HomeHeaderActions";
import { HomeDashboardControls } from "@/components/HomeDashboardControls";
import { WeeklyPlanning, type WeeklyPlanningItem } from "@/components/WeeklyPlanning";
import { PassageManagementFrame } from "@/components/PassageManagementFrame";
import { DecisionCenter } from "@/components/DecisionCenter";
import { buildDecisionItemQueue, getNextDecisionTrip, getNextDecisionTrips } from "@/lib/decisionCenter";
import {
  adjustDecisionWeekRelevance,
  persistDecisionCenterPreferences,
  readDecisionCenterPreferences,
} from "@/lib/decisionCenterPreferences";
import { useDecisionCenterToggleShortcut } from "@/lib/decisionCenterShortcuts";
import {
  persistWeeklyPlanningFavorites,
  readWeeklyPlanningFavorites,
  toggleWeeklyPlanningFavorite,
} from "@/lib/weeklyPlanningPreferences";
import { getWeeklyPlanningWindow } from "@/lib/weeklyPlanningWindow";
import { areAllMonthsExpanded, getNextExpandedMonths } from "@/lib/monthExpansion";
import {
  getAnnualGoalProgress,
  readAnnualEmissionGoal,
  saveAnnualEmissionGoal,
} from "@/lib/annualEmissionGoal";
import type { MonthlyChartData } from "@/components/HomeCharts";
import { getAnnualProgress } from "@/lib/annualProgress";
import { shouldRenderDeferredCharts } from "@/lib/chartLoading";
import { queryCachePolicies } from "@/lib/queryCache";
import {
  buildAttentionItems,
  dismissAttentionItem,
  readAttentionDismissals,
  restoreAttentionItem,
} from "@/lib/attentionCenter";
import {
  persistHomeExpandablePanels,
  readHomeExpandablePanels,
} from "@/lib/homeExpandablePanels";
import {
  areAllHomePanelsOpen,
  getNextHomeGlobalPanelState,
} from "@/lib/homePanelVisibility";
import {
  applyPinnedPanels,
  deleteHomePrioritySet,
  getHomeLayoutProfileState,
  persistHomeDashboardPreferences,
  readHomeDashboardPreferences,
  reorderPinnedPanels,
  reorderPinnedPanelsByDrop,
  restoreDefaultPinnedOrder,
  upsertHomePrioritySet,
  type HomePanelId,
  type HomePanelMoveDirection,
  type HomeLayoutProfile,
} from "@/lib/homeDashboardPreferences";
import { useHomePanelToggleShortcut } from "@/lib/homePanelShortcuts";
import { getActiveManagementFilterCount } from "@/lib/managementFilterSummary";
import { HomeOfflineRecovery } from "@/components/HomeOfflineRecovery";
import {
  formatPlanningSyncTimestamp,
  readPlanningSyncTimestamp,
  savePlanningSyncTimestamp,
} from "@/lib/offlinePlanningSync";
import { readOfflineNextTrips, saveOfflineNextTrips } from "@/lib/offlineNextTrips";

const AnnualSpendChart = lazy(() =>
  import("@/components/HomeCharts").then(module => ({
    default: module.AnnualSpendChart,
  }))
);

// Mantido para possível reativação futura; desativado por decisão de produto.
const LAYOUT_CONTROLS_ENABLED = false;
// Mantido para possível reativação futura; terminais seguem disponíveis no detalhe operacional do bilhete.
const SHOW_TERMINALS_IN_WEEK_SUMMARY = false;
const PriceVariationCharts = lazy(() =>
  import("@/components/HomeCharts").then(module => ({
    default: module.PriceVariationCharts,
  }))
);

/**
 * Memória histórica de números de voo.
 * Analisa todos os voos já salvos e sugere o número mais frequente
 * para a combinação: companhia + direção (ida/volta) + dia da semana + faixa de horário.
 *
 * Regras de match (em ordem de prioridade):
 *   1. Mesma companhia + mesma direção + mesmo dia da semana + mesma faixa de horário (±1h)
 *   2. Mesma companhia + mesma direção + mesmo dia da semana
 *   3. Mesma companhia + mesma direção
 */
function suggestFlightNumber(
  airline: string,
  datetime: string,
  direction: "departure" | "return",
  allWeeks: WeekData[]
): string | null {
  if (!airline || allWeeks.length === 0) return null;

  const isDep = direction === "departure";

  let targetDow: number | null = null;
  let targetHour: number | null = null;
  if (datetime) {
    const d = new Date(datetime);
    if (!isNaN(d.getTime())) {
      targetDow = d.getDay();
      targetHour = d.getHours();
    }
  }

  let maxFreq1 = 0,
    maxItem1: string | null = null;
  let maxFreq2 = 0,
    maxItem2: string | null = null;
  let maxFreq3 = 0,
    maxItem3: string | null = null;

  const freqs1: Record<string, number> = {};
  const freqs2: Record<string, number> = {};
  const freqs3: Record<string, number> = {};

  // ⚡ Bolt: Use a map to avoid re-parsing dates that appear repeatedly
  const dtCache = new Map<string, { dow: number; hour: number } | null>();

  for (let i = 0; i < allWeeks.length; i++) {
    const w = allWeeks[i];
    const a = isDep ? w.departureAirline : w.returnAirline;

    if (a !== airline) continue;

    const fn = isDep ? w.departureFlightNumber : w.returnFlightNumber;
    if (!fn) continue;
    const trimmedFn = fn.trim();
    if (!trimmedFn) continue;

    const flightNum = trimmedFn.toUpperCase();

    // Nível 3: qualquer voo da mesma companhia na mesma direção
    const f3 = (freqs3[flightNum] || 0) + 1;
    freqs3[flightNum] = f3;
    if (f3 > maxFreq3) {
      maxFreq3 = f3;
      maxItem3 = flightNum;
    }

    if (targetDow !== null) {
      const dt = isDep ? w.departureFlightDatetime : w.returnFlightDatetime;
      if (dt) {
        let parsed = dtCache.get(dt);
        if (parsed === undefined) {
          const d = new Date(dt);
          if (!isNaN(d.getTime())) {
            parsed = { dow: d.getDay(), hour: d.getHours() };
          } else {
            parsed = null;
          }
          dtCache.set(dt, parsed);
        }

        if (parsed !== null) {
          if (parsed.dow === targetDow) {
            // Nível 2: mesmo dia da semana
            const f2 = (freqs2[flightNum] || 0) + 1;
            freqs2[flightNum] = f2;
            if (f2 > maxFreq2) {
              maxFreq2 = f2;
              maxItem2 = flightNum;
            }

            if (
              targetHour !== null &&
              Math.abs(parsed.hour - targetHour) <= 1
            ) {
              // Nível 1: mesmo dia da semana + faixa de horário (±1h)
              const f1 = (freqs1[flightNum] || 0) + 1;
              freqs1[flightNum] = f1;
              if (f1 > maxFreq1) {
                maxFreq1 = f1;
                maxItem1 = flightNum;
              }
            }
          }
        }
      }
    }
  }

  if (targetDow !== null && targetHour !== null && maxItem1 !== null)
    return maxItem1;
  if (targetDow !== null && maxItem2 !== null) return maxItem2;
  return maxItem3;
}

interface WeekData {
  weekNumber: number;
  departureDate: string;
  returnDate: string;
  departureDayOfWeek: string;
  returnDayOfWeek: string;
  holiday: string | null;
  isDeleted: number;
  isTicketIssued: number;
  isSelected: number;
  departureAirline?: string | null;
  returnAirline?: string | null;
  departureFlightDatetime?: string | null;
  returnFlightDatetime?: string | null;
  departureAirport?: string | null;
  returnAirport?: string | null;
  departureLocator?: string | null;
  returnLocator?: string | null;
  departureFlightNumber?: string | null;
  returnFlightNumber?: string | null;
  departureTerminal?: string | null;
  returnTerminal?: string | null;
  ticketType?: string | null;
  smilesPoints?: number | null;
  latamPassPoints?: number | null;
  departureRescheduled?: number;
  returnRescheduled?: number;
  departureCancelled?: number;
  returnCancelled?: number;
}

interface PriceMap {
  [weekNumber: number]: { [airline: string]: string };
}

export const HOME_PANEL_PREFERENCES_STORAGE_KEY =
  "smartfly.home.panel-preferences.v1";

export type HomePanelPreferences = {
  summary: boolean;
  filters: boolean;
};

export const DEFAULT_HOME_PANEL_PREFERENCES: HomePanelPreferences = {
  summary: true,
  filters: true,
};

export function readHomePanelPreferences(
  storage: Pick<Storage, "getItem"> | null =
    typeof window === "undefined" ? null : window.localStorage
): HomePanelPreferences {
  if (!storage) return DEFAULT_HOME_PANEL_PREFERENCES;

  try {
    const raw = storage.getItem(HOME_PANEL_PREFERENCES_STORAGE_KEY);
    if (!raw) return DEFAULT_HOME_PANEL_PREFERENCES;
    const parsed = JSON.parse(raw) as Partial<HomePanelPreferences>;
    return {
      summary:
        typeof parsed.summary === "boolean"
          ? parsed.summary
          : DEFAULT_HOME_PANEL_PREFERENCES.summary,
      filters:
        typeof parsed.filters === "boolean"
          ? parsed.filters
          : DEFAULT_HOME_PANEL_PREFERENCES.filters,
    };
  } catch {
    return DEFAULT_HOME_PANEL_PREFERENCES;
  }
}

export function persistHomePanelPreferences(
  preferences: HomePanelPreferences,
  storage: Pick<Storage, "setItem"> | null =
    typeof window === "undefined" ? null : window.localStorage
) {
  storage?.setItem(
    HOME_PANEL_PREFERENCES_STORAGE_KEY,
    JSON.stringify(preferences)
  );
}

// ⚡ Bolt Optimization: Hoisted static date parsing functions outside the render loop
// to avoid O(N*M) object creation and garbage collection.
const parseBR = (s: string) => {
  if (!s || s.length !== 10) return new Date(NaN);
  return new Date(
    +s.substring(6, 10),
    +s.substring(3, 5) - 1,
    +s.substring(0, 2)
  );
};

const parseISO = (s: string) => {
  if (!s || s.length !== 10) return new Date(NaN);
  return new Date(
    +s.substring(0, 4),
    +s.substring(5, 7) - 1,
    +s.substring(8, 10)
  );
};

// Helper: calcula dias restantes e labels
const calcDias = (dataStr: string, hojeMs: number) => {
  const dataEvento = parseISO(dataStr);
  const diffMs = dataEvento.getTime() - hojeMs;
  const diffDias = Math.round(diffMs / (1000 * 60 * 60 * 24));
  const passou = diffDias < 0;
  const ehHoje = diffDias === 0;
  const label = passou
    ? "Já realizado"
    : ehHoje
      ? "🔴 HOJE!"
      : `em ${diffDias} dia${diffDias === 1 ? "" : "s"}`;
  const mm = dataStr.substring(5, 7);
  const dd = dataStr.substring(8, 10);
  const diasSemana = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];
  const diaSemana = diasSemana[dataEvento.getDay()];
  return {
    passou,
    ehHoje,
    label,
    mm,
    dd,
    diaSemana,
    diffDias,
  };
};

// ⚡ Bolt Optimization: Arrays hoisted to the module level so they are only allocated once
const todosJogos = [
  {
    data: "2026-06-13",
    adversario: "Marrocos",
    cidade: "Nova York/NJ",
    bandeira: "🇲🇦",
    horario: "16h",
  },
  {
    data: "2026-06-19",
    adversario: "Haiti",
    cidade: "Filadélfia",
    bandeira: "🇭🇹",
    horario: "21h",
  },
  {
    data: "2026-06-24",
    adversario: "Escócia",
    cidade: "Miami",
    bandeira: "🏴󠁧󠁢󠁳󠁣󠁴󠁿",
    horario: "20h",
  },
];

const todasFases = [
  {
    fase: "32-avos de Final",
    icone: "🏟️",
    inicio: "2026-06-28",
    fim: "2026-07-03",
    cidades: "Várias cidades",
    cor: "blue",
  },
  {
    fase: "Oitavas de Final",
    icone: "⚡",
    inicio: "2026-07-04",
    fim: "2026-07-07",
    cidades: "Várias cidades",
    cor: "blue",
  },
  {
    fase: "Quartas de Final",
    icone: "🔥",
    inicio: "2026-07-09",
    fim: "2026-07-11",
    cidades: "Várias cidades",
    cor: "orange",
  },
  {
    fase: "Semifinais",
    icone: "🏆",
    inicio: "2026-07-14",
    fim: "2026-07-15",
    cidades: "Dallas, TX",
    cor: "purple",
  },
  {
    fase: "Final",
    icone: "🥇",
    inicio: "2026-07-19",
    fim: "2026-07-19",
    cidades: "MetLife Stadium, NJ",
    cor: "yellow",
  },
];

const todosJogosParsed = todosJogos.map(jogo => ({
  ...jogo,
  dataMs: parseISO(jogo.data).getTime(),
}));

const todasFasesParsed = todasFases.map(fase => ({
  ...fase,
  inicioMs: parseISO(fase.inicio).getTime(),
  fimMs: parseISO(fase.fim).getTime(),
}));

const CHART_MONTHS = [
  { num: "03", label: "Mar" },
  { num: "04", label: "Abr" },
  { num: "05", label: "Mai" },
  { num: "06", label: "Jun" },
  { num: "07", label: "Jul" },
  { num: "08", label: "Ago" },
  { num: "09", label: "Set" },
  { num: "10", label: "Out" },
  { num: "11", label: "Nov" },
  { num: "12", label: "Dez" },
];

export type HomeMode = "home" | "passage-management";

type HomeProps = {
  mode?: HomeMode;
};

export default function Home({ mode = "home" }: HomeProps) {
  const isManagementView = mode === "passage-management";
  // Theme state
  const { theme, toggleTheme, colorPreset, setColorPreset, navyIntensity, setNavyIntensity } = useTheme();

  // ⚡ Bolt Optimization: Hoje ms calculado uma vez por renderização e compartilhado
  // entre as semanas mapeadas. (Não colocar no escopo global devido a problemas de data stale em SPAs)
  const hojeMs = new Date().setHours(0, 0, 0, 0);

  // Auth state
  const [showLoginModal, setShowLoginModal] = useState(false);

  const authCheckQuery = trpc.flightAuth.check.useQuery();

  const logoutAuthMutation = trpc.flightAuth.logout.useMutation();
  const authUtils = trpc.useUtils();

  const isAuthenticated = authCheckQuery.data?.authenticated ?? false;

  const handleLogout = () => {
    logoutAuthMutation.mutate(undefined, {
      onSuccess: () => {
        authUtils.flightAuth.check.invalidate();
        toast.success("Sessão encerrada.");
      },
    });
  };

  // Guard: show login modal when unauthenticated mutation fails
  const requireAuth = (fn: () => void) => {
    if (!isAuthenticated) {
      setShowLoginModal(true);
      return;
    }
    fn();
  };

  const [filterMonth, setFilterMonth] = useState<string>("all");
  const [filterAirline, setFilterAirline] = useState<string>("all");
  const [filterTicketStatus, setFilterTicketStatus] = useState<string>("all");
  const [departureTimeFilter, setDepartureTimeFilter] = useState<number>(0); // 00:00 por padrão
  const [returnTimeFilter, setReturnTimeFilter] = useState<number>(0); // 00:00 por padrão

  // Funcoes auxiliares para conversao de horario
  const minutesToTime = (minutes: number): string => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hours.toString().padStart(2, "0")}:${mins.toString().padStart(2, "0")}`;
  };

  const getFlightMinutes = (datetimeStr: string | undefined | null): number => {
    if (!datetimeStr) return -1; // -1 indica que não há horário definido
    // Formato esperado: "2026-02-22T17:55" ou "17:55"
    const tIndex = datetimeStr.indexOf("T");
    const timeStr = tIndex >= 0 ? datetimeStr.slice(tIndex + 1) : datetimeStr;
    const parts = timeStr.split(":");
    if (parts.length < 2) return -1;
    const h = parseInt(parts[0], 10);
    const m = parseInt(parts[1], 10);
    if (isNaN(h) || isNaN(m)) return -1;
    return h * 60 + m;
  };

  // Estado para filtro de empresas no gráfico (todas selecionadas por padrão)
  const [chartSelectedAirlines, setChartSelectedAirlines] = useState<
    Set<string>
  >(() => new Set(airlines.map(a => a.id)));
  const [isAnnualChartVisible, setIsAnnualChartVisible] = useState(false);
  const [isPriceChartVisible, setIsPriceChartVisible] = useState(false);
  const toggleChartAirline = (id: string) => {
    setChartSelectedAirlines(prev => {
      const next = new Set(prev);
      if (next.has(id)) {
        if (next.size === 1) return prev; // manter pelo menos 1
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };
  const selectAllChartAirlines = () =>
    setChartSelectedAirlines(new Set(airlines.map(a => a.id)));
  const clearChartAirlines = () =>
    setChartSelectedAirlines(new Set([airlines[0].id]));
  const [sortBy, setSortBy] = useState<string>("week");
  const [expandedWeek, setExpandedWeek] = useState<number | null>(null);
  const [departureAirport, setDepartureAirport] =
    useState<DepartureAirport>("GRU");
  const [showCheapestOnly, setShowCheapestOnly] = useState<boolean>(false);
  const [pricePercentile, setPricePercentile] = useState<number>(25);
  const activeManagementFilterCount = getActiveManagementFilterCount({
    month: filterMonth,
    airline: filterAirline,
    ticketStatus: filterTicketStatus,
    cheapestOnly: showCheapestOnly,
    departureTime: departureTimeFilter,
    returnTime: returnTimeFilter,
  });

  const [savingPrice, setSavingPrice] = useState<{
    week: number;
    airline: string;
  } | null>(null);

  const [savingMiles, setSavingMiles] = useState<{
    week: number;
    field: "smilesPoints" | "latamPassPoints";
  } | null>(null);

  // Estado para ocultar valores monetários (privacidade)
  // Sempre inicia oculto (true); só pode ser alternado quando autenticado
  const [hideValues, setHideValues] = useState<boolean>(true);
  const [expandSummary, setExpandSummary] = useState<boolean>(
    () => readHomePanelPreferences().summary
  );
  const [expandFilters, setExpandFilters] = useState<boolean>(
    () => readHomePanelPreferences().filters
  );
  const [homeDashboardPreferences, setHomeDashboardPreferences] = useState(() =>
    readHomeDashboardPreferences()
  );
  useEffect(() => {
    persistHomePanelPreferences({
      summary: expandSummary,
      filters: expandFilters,
    });
  }, [expandSummary, expandFilters]);
  const toggleHideValues = () => {
    if (!isAuthenticated) {
      setShowLoginModal(true);
      return;
    }
    setHideValues(prev => !prev);
  };
  // Função helper para mascarar valores monetários
  const maskValue = (value: string | number) =>
    hideValues ? "••••" : String(value);

  // Estados temporários unificados para todos os campos dos cards Ida/Volta
  const [tempDepartureDatetime, setTempDepartureDatetime] = useState<{
    [weekNumber: number]: string;
  }>({});
  const [tempReturnDatetime, setTempReturnDatetime] = useState<{
    [weekNumber: number]: string;
  }>({});
  const [tempDepartureLocator, setTempDepartureLocator] = useState<{
    [weekNumber: number]: string;
  }>({});
  const [tempReturnLocator, setTempReturnLocator] = useState<{
    [weekNumber: number]: string;
  }>({});
  const [tempDepartureFlightNumber, setTempDepartureFlightNumber] = useState<{
    [weekNumber: number]: string;
  }>({});
  const [tempReturnFlightNumber, setTempReturnFlightNumber] = useState<{
    [weekNumber: number]: string;
  }>({});
  const [tempDepartureAirport, setTempDepartureAirport] = useState<{
    [weekNumber: number]: string;
  }>({});
  const [tempReturnAirport, setTempReturnAirport] = useState<{
    [weekNumber: number]: string;
  }>({});
  const [tempDepartureAirline, setTempDepartureAirline] = useState<{
    [weekNumber: number]: string;
  }>({});
  const [tempReturnAirline, setTempReturnAirline] = useState<{
    [weekNumber: number]: string;
  }>({});
  const [tempDepartureTerminal, setTempDepartureTerminal] = useState<{
    [weekNumber: number]: string;
  }>({});
  const [tempReturnTerminal, setTempReturnTerminal] = useState<{
    [weekNumber: number]: string;
  }>({});
  const [tempTicketType, setTempTicketType] = useState<{
    [weekNumber: number]: string;
  }>({});
  // Controle de salvamento em andamento por semana
  const [savingTicket, setSavingTicket] = useState<{
    [weekNumber: number]: boolean;
  }>({});
  const [savedTicket, setSavedTicket] = useState<{
    [weekNumber: number]: boolean;
  }>({});
  const ticketSaveFeedbackTimeouts = useRef<
    Record<number, ReturnType<typeof setTimeout> | undefined>
  >({});
  const showTicketSaveSuccess = useCallback((weekNumber: number) => {
    const previousTimeout = ticketSaveFeedbackTimeouts.current[weekNumber];
    if (previousTimeout) clearTimeout(previousTimeout);

    setSavedTicket(prev => ({ ...prev, [weekNumber]: true }));
    ticketSaveFeedbackTimeouts.current[weekNumber] = setTimeout(() => {
      setSavedTicket(prev => ({ ...prev, [weekNumber]: false }));
      delete ticketSaveFeedbackTimeouts.current[weekNumber];
    }, 4_500);
  }, []);
  useEffect(
    () => () => {
      Object.values(ticketSaveFeedbackTimeouts.current).forEach(timeout => {
        if (timeout) clearTimeout(timeout);
      });
    },
    []
  );
  // Rastreia quais campos de número do voo foram preenchidos por sugestão automática
  // (e ainda não foram editados manualmente pelo usuário)
  const [suggestedDepartureFlightNumber, setSuggestedDepartureFlightNumber] =
    useState<{ [weekNumber: number]: boolean }>({});
  const [suggestedReturnFlightNumber, setSuggestedReturnFlightNumber] =
    useState<{ [weekNumber: number]: boolean }>({});
  // Antecedência configurável para eventos de calendário (persiste no dispositivo)
  const [calendarLeadMinutes, setCalendarLeadMinutes] = useState<number>(() => {
    const saved = localStorage.getItem("calendarLeadMinutes");
    return saved ? parseInt(saved, 10) : 120;
  });
  // Duração estimada do voo configurável (persiste no dispositivo)
  const [calendarDurationMinutes, setCalendarDurationMinutes] =
    useState<number>(() => {
      const saved = localStorage.getItem("calendarDurationMinutes");
      return saved ? parseInt(saved, 10) : 75;
    });

  // Usar contexto de ano compartilhado
  const { selectedYear } = useYear();
  const [decisionCenterPreferences, setDecisionCenterPreferences] = useState(() =>
    readDecisionCenterPreferences(selectedYear)
  );
  useEffect(() => {
    setDecisionCenterPreferences(readDecisionCenterPreferences(selectedYear));
  }, [selectedYear]);
  useEffect(() => {
    persistDecisionCenterPreferences(selectedYear, decisionCenterPreferences);
  }, [selectedYear, decisionCenterPreferences]);

  // tRPC queries
  const weeksQuery = trpc.flights.getWeeks.useQuery(
    { year: selectedYear },
    queryCachePolicies.annualPlanning
  );
  const progressComparisonQuery = trpc.flights.getProgressComparison.useQuery(
    { years: [...AVAILABLE_PLANNING_YEARS] },
    queryCachePolicies.annualPlanning
  );
  const pricesQuery = trpc.flights.getPrices.useQuery({ year: selectedYear }, {
    ...queryCachePolicies.annualPlanning,
    enabled: isAuthenticated,
  });

  const publicPricesQuery = trpc.flights.getPublicPrices.useQuery({ year: selectedYear }, {
    ...queryCachePolicies.annualPlanning,
    enabled: !isAuthenticated,
  });

  const additionalFlightsQuery = trpc.additionalFlights.getYear.useQuery(
    { year: selectedYear },
    { ...queryCachePolicies.annualPlanning, enabled: isAuthenticated }
  );
  const additionalFlightsByWeek = useMemo(() => {
    const grouped: Record<number, AdditionalFlightRecord[]> = {};
    for (const flight of additionalFlightsQuery.data ?? []) {
      (grouped[flight.weekNumber] ??= []).push(flight as AdditionalFlightRecord);
    }
    return grouped;
  }, [additionalFlightsQuery.data]);

  const currentPricesData: (FlightPrice | PublicPrice)[] | undefined =
    isAuthenticated
      ? (pricesQuery.data as FlightPrice[] | undefined)
      : (publicPricesQuery.data as PublicPrice[] | undefined);
  const utils = trpc.useUtils();

  // Pull-to-refresh: puxar para baixo no topo da página para recarregar os dados
  const handleRefresh = useCallback(async () => {
    await Promise.all([
      utils.flights.getWeeks.invalidate({ year: selectedYear }),
      utils.flights.getProgressComparison.invalidate({
        years: [...AVAILABLE_PLANNING_YEARS],
      }),
      utils.flights.getPrices.invalidate({ year: selectedYear }),
    ]);
    toast.success("Dados atualizados!", { duration: 1500 });
  }, [selectedYear, utils]);

  const { pullDistance, isRefreshing, isPulling } = usePullToRefresh({
    threshold: 80,
    maxPull: 120,
    onRefresh: handleRefresh,
  });

  // Estado para rastrear última atualização
  const [lastUpdateTime, setLastUpdateTime] = useState<Date | null>(null);
  const [isOnline, setIsOnline] = useState(() =>
    typeof navigator === "undefined" ? true : navigator.onLine
  );
  const [lastPlanningSyncAt, setLastPlanningSyncAt] = useState(() =>
    readPlanningSyncTimestamp(selectedYear)
  );
  const [offlineNextTrips, setOfflineNextTrips] = useState(() =>
    readOfflineNextTrips(selectedYear)
  );

  useEffect(() => {
    setLastPlanningSyncAt(readPlanningSyncTimestamp(selectedYear));
    setOfflineNextTrips(readOfflineNextTrips(selectedYear));
  }, [selectedYear]);

  useEffect(() => {
    const updateOnlineState = () => setIsOnline(navigator.onLine);
    window.addEventListener("online", updateOnlineState);
    window.addEventListener("offline", updateOnlineState);
    return () => {
      window.removeEventListener("online", updateOnlineState);
      window.removeEventListener("offline", updateOnlineState);
    };
  }, []);

  // Escutar evento global de requer login (disparado pelo main.tsx quando query protegida falha)
  // Garante que o modal de login proprietário seja aberto em vez do Manus OAuth externo
  useEffect(() => {
    const handleRequireLogin = () => setShowLoginModal(true);
    window.addEventListener("flight:require-login", handleRequireLogin);
    return () =>
      window.removeEventListener("flight:require-login", handleRequireLogin);
  }, []);

  // Atualizar timestamp quando os dados forem atualizados
  useEffect(() => {
    if (weeksQuery.data && weeksQuery.data.length > 0) {
      const now = new Date();
      setLastUpdateTime(now);
      savePlanningSyncTimestamp(selectedYear, now.getTime());
      setLastPlanningSyncAt(now.getTime());
    }
  }, [selectedYear, weeksQuery.data]);

  // Formatar data/hora da última atualização
  const formatLastUpdate = (date: Date | null) => {
    if (!date) return "Nunca";
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return "Agora";
    if (diffMins < 60) return `${diffMins}min atrás`;
    if (diffHours < 24) return `${diffHours}h atrás`;
    if (diffDays === 1) return "Ontem";
    if (diffDays < 7) return `${diffDays}d atrás`;

    return date.toLocaleDateString("pt-BR", {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  // Push Notifications
  const {
    status: pushStatus,
    isSubscribed: pushSubscribed,
    isLoading: pushLoading,
    subscribe: pushSubscribe,
    unsubscribe: pushUnsubscribe,
    sendTest: pushSendTest,
    isSendingTest: pushSendingTest,
  } = usePushNotifications(selectedYear);

  // Ref que rastreia quais semanas já foram inicializadas — evita sobrescrever
  // o que o usuário está digitando quando o tRPC faz refetch em background.

  // Sincronizar campos do banco para estado local.
  // Regra: campos de texto (localizador, número do voo, etc.) só são inicializados
  // UMA VEZ por semana para não sobrescrever o que o usuário está digitando.
  // Campos de data/hora são SEMPRE re-sincronizados com o banco para garantir que
  // valores já salvos sejam exibidos corretamente ao abrir o card.
  useEffect(() => {
    if (!weeksQuery.data) return;

    // Semanas novas (nunca inicializadas) — inicializar todos os campos
    // Campos de texto (localizador, número do voo, aeroporto, companhia aérea, tipo de bilhete):
    // Sempre re-sincronizar com o banco para TODAS as semanas.
    // Isso garante que valores já salvos aparecem ao abrir o card, mesmo após refetch ou login.
    // Apenas os campos de data/hora já tinham essa lógica, agora estendida para os demais.

    setTempDepartureLocator(prev => {
      const next = { ...prev };
      weeksQuery.data!.forEach(w => {
        const saved = w.departureLocator ?? "";
        // Só preservar valor local se ele for não-vazio (usuário digitou algo)
        if (prev[w.weekNumber] && prev[w.weekNumber] !== saved) {
          next[w.weekNumber] = prev[w.weekNumber];
        } else {
          next[w.weekNumber] = saved;
        }
      });
      return next;
    });
    setTempReturnLocator(prev => {
      const next = { ...prev };
      weeksQuery.data!.forEach(w => {
        const saved = w.returnLocator ?? "";
        if (prev[w.weekNumber] && prev[w.weekNumber] !== saved) {
          next[w.weekNumber] = prev[w.weekNumber];
        } else {
          next[w.weekNumber] = saved;
        }
      });
      return next;
    });
    setTempDepartureFlightNumber(prev => {
      const next = { ...prev };
      weeksQuery.data!.forEach(w => {
        const saved = w.departureFlightNumber ?? "";
        if (prev[w.weekNumber] && prev[w.weekNumber] !== saved) {
          next[w.weekNumber] = prev[w.weekNumber];
        } else {
          next[w.weekNumber] = saved;
        }
      });
      return next;
    });
    setTempReturnFlightNumber(prev => {
      const next = { ...prev };
      weeksQuery.data!.forEach(w => {
        const saved = w.returnFlightNumber ?? "";
        if (prev[w.weekNumber] && prev[w.weekNumber] !== saved) {
          next[w.weekNumber] = prev[w.weekNumber];
        } else {
          next[w.weekNumber] = saved;
        }
      });
      return next;
    });
    setTempDepartureAirport(prev => {
      const next = { ...prev };
      weeksQuery.data!.forEach(w => {
        const saved = w.departureAirport ?? "";
        if (prev[w.weekNumber] && prev[w.weekNumber] !== saved) {
          next[w.weekNumber] = prev[w.weekNumber];
        } else {
          next[w.weekNumber] = saved;
        }
      });
      return next;
    });
    setTempReturnAirport(prev => {
      const next = { ...prev };
      weeksQuery.data!.forEach(w => {
        const saved = w.returnAirport ?? "";
        if (prev[w.weekNumber] && prev[w.weekNumber] !== saved) {
          next[w.weekNumber] = prev[w.weekNumber];
        } else {
          next[w.weekNumber] = saved;
        }
      });
      return next;
    });
    setTempDepartureAirline(prev => {
      const next = { ...prev };
      weeksQuery.data!.forEach(w => {
        const saved = w.departureAirline ?? "";
        if (prev[w.weekNumber] && prev[w.weekNumber] !== saved) {
          next[w.weekNumber] = prev[w.weekNumber];
        } else {
          next[w.weekNumber] = saved;
        }
      });
      return next;
    });
    setTempReturnAirline(prev => {
      const next = { ...prev };
      weeksQuery.data!.forEach(w => {
        const saved = w.returnAirline ?? "";
        if (prev[w.weekNumber] && prev[w.weekNumber] !== saved) {
          next[w.weekNumber] = prev[w.weekNumber];
        } else {
          next[w.weekNumber] = saved;
        }
      });
      return next;
    });
    setTempDepartureTerminal(prev => {
      const next = { ...prev };
      weeksQuery.data!.forEach(w => {
        const saved = (w as any).departureTerminal ?? "";
        if (prev[w.weekNumber] && prev[w.weekNumber] !== saved) {
          next[w.weekNumber] = prev[w.weekNumber];
        } else {
          next[w.weekNumber] = saved;
        }
      });
      return next;
    });
    setTempReturnTerminal(prev => {
      const next = { ...prev };
      weeksQuery.data!.forEach(w => {
        const saved = (w as any).returnTerminal ?? "";
        if (prev[w.weekNumber] && prev[w.weekNumber] !== saved) {
          next[w.weekNumber] = prev[w.weekNumber];
        } else {
          next[w.weekNumber] = saved;
        }
      });
      return next;
    });
    setTempTicketType(prev => {
      const next = { ...prev };
      weeksQuery.data!.forEach(w => {
        const saved = w.ticketType ?? "roundtrip";
        if (prev[w.weekNumber] && prev[w.weekNumber] !== saved) {
          next[w.weekNumber] = prev[w.weekNumber];
        } else {
          next[w.weekNumber] = saved;
        }
      });
      return next;
    });

    // Campos de data/hora: sempre re-sincronizar com o banco para TODAS as semanas
    // Isso garante que valores já salvos aparecem ao abrir o card, mesmo após refetch
    setTempDepartureDatetime(prev => {
      const next = { ...prev };
      weeksQuery.data!.forEach(w => {
        const saved = (w as any).departureFlightDatetime ?? "";
        if (saved) {
          // Valor já salvo no banco: usar como está (formato: YYYY-MM-DDTHH:mm)
          next[w.weekNumber] = saved;
        } else if (!(w.weekNumber in next) || !next[w.weekNumber]) {
          // Sem valor salvo e sem valor local: pré-preencher com a data de ida da semana
          if (w.departureDate && w.departureDate.length === 10) {
            next[w.weekNumber] =
              `${w.departureDate.substring(6, 10)}-${w.departureDate.substring(3, 5)}-${w.departureDate.substring(0, 2)}`;
          } else {
            next[w.weekNumber] = "";
          }
        }
        // Se já há valor local e não há valor no banco: manter o que o usuário digitou
      });
      return next;
    });
    setTempReturnDatetime(prev => {
      const next = { ...prev };
      weeksQuery.data!.forEach(w => {
        const saved = (w as any).returnFlightDatetime ?? "";
        if (saved) {
          // Valor já salvo no banco: usar como está (formato: YYYY-MM-DDTHH:mm)
          next[w.weekNumber] = saved;
        } else if (!(w.weekNumber in next) || !next[w.weekNumber]) {
          // Sem valor salvo e sem valor local: pré-preencher com a data de retorno da semana
          if (w.returnDate && w.returnDate.length === 10) {
            next[w.weekNumber] =
              `${w.returnDate.substring(6, 10)}-${w.returnDate.substring(3, 5)}-${w.returnDate.substring(0, 2)}`;
          } else {
            next[w.weekNumber] = "";
          }
        }
        // Se já há valor local e não há valor no banco: manter o que o usuário digitou
      });
      return next;
    });
  }, [weeksQuery.data]);
  const ensureYearWeeksMutation = trpc.flights.ensureYearWeeks.useMutation();
  const updateStatusMutation = trpc.flights.updateWeekStatus.useMutation();
  const updateDatesMutation = trpc.flights.updateWeekDates.useMutation();
  const savePriceMutation = trpc.flights.savePrice.useMutation();

  const invalidateFinancialYear = () =>
    Promise.all([
      utils.financial.getYearSummary.invalidate({ year: selectedYear }),
      utils.financial.getWeeklyData.invalidate({ year: selectedYear }),
      utils.financial.getProjections.invalidate(),
    ]);

  const invalidatePlanningAndFinancialYear = () =>
    Promise.all([
      utils.flights.getWeeks.invalidate({ year: selectedYear }),
      invalidateFinancialYear(),
    ]);

  const invalidatePricesAndFinancialYear = () =>
    Promise.all([
      utils.flights.getPrices.invalidate({ year: selectedYear }),
      invalidateFinancialYear(),
    ]);

  // Gera o calendário do exercício somente após login. A operação é idempotente
  // e nunca substitui semanas que já foram personalizadas.
  useEffect(() => {
    if (
      isAuthenticated &&
      weeksQuery.isSuccess &&
      weeksQuery.data.length === 0 &&
      !ensureYearWeeksMutation.isPending
    ) {
      ensureYearWeeksMutation.mutate(
        { year: selectedYear },
        {
          onSuccess: () => utils.flights.getWeeks.invalidate({ year: selectedYear }),
        }
      );
    }
  }, [
    ensureYearWeeksMutation,
    isAuthenticated,
    selectedYear,
    utils.flights.getWeeks,
    weeksQuery.data,
    weeksQuery.isSuccess,
  ]);

  // Build price map from DB
  const priceMap: PriceMap = useMemo(() => {
    const map: PriceMap = {};
    if (currentPricesData) {
      for (const p of currentPricesData) {
        if (!map[p.weekNumber]) map[p.weekNumber] = {};
        map[p.weekNumber][p.airline] = p.price;
      }
    }
    return map;
  }, [currentPricesData]);

  // Use DB data if available, otherwise fallback to static data
  const weeksData: WeekData[] = useMemo(() => {
    if (weeksQuery.data && weeksQuery.data.length > 0) {
      return weeksQuery.data.map(w => ({
        weekNumber: w.weekNumber,
        departureDate: w.departureDate,
        returnDate: w.returnDate,
        departureDayOfWeek: w.departureDayOfWeek,
        returnDayOfWeek: w.returnDayOfWeek,
        holiday: w.holiday ?? null,
        isDeleted: w.isDeleted,
        isTicketIssued: w.isTicketIssued,
        isSelected: w.isSelected,
        departureAirline: w.departureAirline ?? null,
        returnAirline: w.returnAirline ?? null,
        departureFlightDatetime: w.departureFlightDatetime ?? null,
        returnFlightDatetime: w.returnFlightDatetime ?? null,
        departureAirport: (w as any).departureAirport ?? null,
        returnAirport: (w as any).returnAirport ?? null,
        departureLocator: (w as any).departureLocator ?? null,
        returnLocator: (w as any).returnLocator ?? null,
        departureFlightNumber: (w as any).departureFlightNumber ?? null,
        returnFlightNumber: (w as any).returnFlightNumber ?? null,
        departureTerminal: (w as any).departureTerminal ?? null,
        returnTerminal: (w as any).returnTerminal ?? null,
        ticketType: (w as any).ticketType ?? "roundtrip",
        smilesPoints: (w as any).smilesPoints ?? null,
        latamPassPoints: (w as any).latamPassPoints ?? null,
        departureRescheduled: (w as any).departureRescheduled ?? 0,
        returnRescheduled: (w as any).returnRescheduled ?? 0,
        departureCancelled: (w as any).departureCancelled ?? 0,
        returnCancelled: (w as any).returnCancelled ?? 0,
        additionalFlights: additionalFlightsByWeek[w.weekNumber] ?? [],
      }));
    }
    // Não usar fallback estático: semanas de outro exercício jamais podem ser exibidas.
    return [];
  }, [weeksQuery.data, additionalFlightsByWeek]);

  // ⚡ Otimização: pré-computa o menor preço de cada semana em um mapa
  // Reduz operações de O(n) array allocations por chamada para O(1) lookup
  const lowestPriceMap = useMemo(() => {
    const map: Record<number, number> = {};
    for (const weekStr in priceMap) {
      const weekNumber = parseInt(weekStr);
      const weekPrices = priceMap[weekNumber];
      if (!weekPrices) continue;
      let min = Infinity;
      let found = false;
      for (const key in weekPrices) {
        const val = parseFloat(weekPrices[key] as string);
        if (!isNaN(val)) {
          if (val < min) min = val;
          found = true;
        }
      }
      if (found) map[weekNumber] = min;
    }
    return map;
  }, [priceMap]);
  const [favoriteWeeks, setFavoriteWeeks] = useState(() =>
    readWeeklyPlanningFavorites()
  );

  const weeklyPlanningItems: WeeklyPlanningItem[] = useMemo(() => {
    return getWeeklyPlanningWindow(weeksData, selectedYear).map(({ item: week, position }) => {
        const lowestPrice = lowestPriceMap[week.weekNumber] ?? null;
        const departureAirport = week.departureAirport?.trim();
        const returnAirport = week.returnAirport?.trim();
        return {
          weekNumber: week.weekNumber,
          departureDate: week.departureDate,
          returnDate: week.returnDate,
          route:
            departureAirport && returnAirport
              ? `${departureAirport} → ${returnAirport}`
              : "Rota a definir",
          airline: week.departureAirline || week.returnAirline || null,
          lowestPrice,
          favorite: favoriteWeeks.includes(week.weekNumber),
          temporalPosition: position,
          status: week.isTicketIssued
            ? "issued"
            : lowestPrice !== null
              ? "watch"
              : "pending",
        };
      });
  }, [favoriteWeeks, lowestPriceMap, selectedYear, weeksData]);

  const handleToggleWeeklyFavorite = (weekNumber: number) => {
    setFavoriteWeeks(current => {
      const next = toggleWeeklyPlanningFavorite(current, weekNumber);
      persistWeeklyPlanningFavorites(next);
      return next;
    });
  };

  const getLowestPrice = useCallback(
    (weekNumber: number): number | null => {
      const min = lowestPriceMap[weekNumber];
      return min !== undefined ? min : null;
    },
    [lowestPriceMap]
  );

  const attentionItems = useMemo(
    () => buildAttentionItems(weeksData, priceMap),
    [weeksData, priceMap]
  );
  const annualProgress = useMemo(
    () => getAnnualProgress(weeksData),
    [weeksData]
  );
  const [annualEmissionGoal, setAnnualEmissionGoal] = useState(() =>
    readAnnualEmissionGoal(selectedYear, annualProgress.totalWeeks)
  );
  const [comparisonGoals, setComparisonGoals] = useState<Record<number, number>>({});
  const [expandablePanels, setExpandablePanels] = useState(() =>
    readHomeExpandablePanels()
  );
  useEffect(() => {
    setAnnualEmissionGoal(
      readAnnualEmissionGoal(selectedYear, annualProgress.totalWeeks)
    );
  }, [annualProgress.totalWeeks, selectedYear]);
  const annualGoalProgress = useMemo(
    () => getAnnualGoalProgress(annualProgress.issuedWeeks, annualEmissionGoal),
    [annualEmissionGoal, annualProgress.issuedWeeks]
  );
  const comparisonWithGoals = useMemo(
    () =>
      (progressComparisonQuery.data ?? []).map(item => {
        const goal =
          item.year === selectedYear
            ? annualEmissionGoal
            : comparisonGoals[item.year] ??
              readAnnualEmissionGoal(item.year, item.totalWeeks);
        return {
          ...item,
          goal,
          goalProgress: getAnnualGoalProgress(item.issuedWeeks, goal),
        };
      }),
    [annualEmissionGoal, comparisonGoals, progressComparisonQuery.data, selectedYear]
  );
  const persistDashboardPreferences = (
    next: typeof homeDashboardPreferences
  ) => {
    setHomeDashboardPreferences(next);
    persistHomeDashboardPreferences(next);
  };
  const markDashboardLayoutAsCustom = () => {
    if (homeDashboardPreferences.profile === "custom") return;
    persistDashboardPreferences({
      ...homeDashboardPreferences,
      profile: "custom",
    });
  };
  const applyHomePanelState = (next: ReturnType<typeof getNextHomeGlobalPanelState>) => {
    setExpandSummary(next.summary);
    setExpandFilters(next.filters);
    setExpandablePanels(next.expandablePanels);
    persistHomePanelPreferences({ summary: next.summary, filters: next.filters });
    persistHomeExpandablePanels(next.expandablePanels);
  };
  const updateExpandablePanel = (
    panel: "annualProgress" | "attentionCenter" | "priceVariation"
  ) => {
    setExpandablePanels(previous => {
      const next = { ...previous, [panel]: !previous[panel] };
      persistHomeExpandablePanels(next);
      return next;
    });
    markDashboardLayoutAsCustom();
  };
  const allHomePanelsAreOpen = areAllHomePanelsOpen({
    summary: expandSummary,
    filters: expandFilters,
    expandablePanels,
  });
  const toggleAllHomePanels = () => {
    const next = getNextHomeGlobalPanelState({
      summary: expandSummary,
      filters: expandFilters,
      expandablePanels,
    }, homeDashboardPreferences.pinnedPanels);

    applyHomePanelState(next);
    persistDashboardPreferences({
      ...homeDashboardPreferences,
      profile: allHomePanelsAreOpen ? "compact" : "complete",
    });
  };
  const applyHomeLayoutProfile = (profile: Exclude<HomeLayoutProfile, "custom">) => {
    const next = applyPinnedPanels(
      getHomeLayoutProfileState(profile),
      homeDashboardPreferences.pinnedPanels
    );
    applyHomePanelState(next);
    persistDashboardPreferences({ ...homeDashboardPreferences, profile });
  };
  const togglePriorityPanel = (panel: HomePanelId) => {
    const isPinned = homeDashboardPreferences.pinnedPanels.includes(panel);
    const pinnedPanels = isPinned
      ? homeDashboardPreferences.pinnedPanels.filter(item => item !== panel)
      : [...homeDashboardPreferences.pinnedPanels, panel];
    const nextPreferences = {
      ...homeDashboardPreferences,
      profile: "custom" as const,
      pinnedPanels,
    };
    persistDashboardPreferences(nextPreferences);

    if (!isPinned) {
      applyHomePanelState(
        applyPinnedPanels(
          { summary: expandSummary, filters: expandFilters, expandablePanels },
          pinnedPanels
        )
      );
    }
  };
  const movePriorityPanel = (
    panel: HomePanelId,
    direction: HomePanelMoveDirection
  ) => {
    const pinnedPanels = reorderPinnedPanels(
      homeDashboardPreferences.pinnedPanels,
      panel,
      direction
    );

    if (pinnedPanels === homeDashboardPreferences.pinnedPanels) return;
    persistDashboardPreferences({
      ...homeDashboardPreferences,
      profile: "custom",
      pinnedPanels,
    });
  };
  const reorderPriorityPanelByDrop = (
    sourcePanel: HomePanelId,
    targetPanel: HomePanelId
  ) => {
    const pinnedPanels = reorderPinnedPanelsByDrop(
      homeDashboardPreferences.pinnedPanels,
      sourcePanel,
      targetPanel
    );
    if (pinnedPanels === homeDashboardPreferences.pinnedPanels) return;
    persistDashboardPreferences({
      ...homeDashboardPreferences,
      profile: "custom",
      pinnedPanels,
    });
  };
  const restorePriorityDefaultOrder = () => {
    persistDashboardPreferences({
      ...homeDashboardPreferences,
      profile: "custom",
      pinnedPanels: restoreDefaultPinnedOrder(homeDashboardPreferences.pinnedPanels),
    });
  };
  const savePrioritySet = (name: string) => {
    const prioritySets = upsertHomePrioritySet(
      homeDashboardPreferences.prioritySets,
      name,
      homeDashboardPreferences.pinnedPanels
    );
    persistDashboardPreferences({ ...homeDashboardPreferences, prioritySets });
  };
  const applyPrioritySet = (setId: string) => {
    const prioritySet = homeDashboardPreferences.prioritySets.find(set => set.id === setId);
    if (!prioritySet) return;
    persistDashboardPreferences({
      ...homeDashboardPreferences,
      profile: "custom",
      pinnedPanels: prioritySet.pinnedPanels,
    });
    applyHomePanelState(
      applyPinnedPanels(
        { summary: expandSummary, filters: expandFilters, expandablePanels },
        prioritySet.pinnedPanels
      )
    );
  };
  const deletePrioritySet = (setId: string) => {
    persistDashboardPreferences({
      ...homeDashboardPreferences,
      prioritySets: deleteHomePrioritySet(homeDashboardPreferences.prioritySets, setId),
    });
  };
  useHomePanelToggleShortcut(toggleAllHomePanels, LAYOUT_CONTROLS_ENABLED);
  const toggleDecisionCenterExpansion = useCallback(() => {
    setDecisionCenterPreferences(previous => ({
      ...previous,
      isExpanded: !previous.isExpanded,
    }));
  }, []);
  const toggleDecisionCenterPin = useCallback(() => {
    setDecisionCenterPreferences(previous => ({
      ...previous,
      isPinned: !previous.isPinned,
    }));
  }, []);
  useDecisionCenterToggleShortcut(toggleDecisionCenterExpansion, !isManagementView);
  const handleSaveAnnualGoal = (goal: number) => {
    const savedGoal = saveAnnualEmissionGoal(
      selectedYear,
      goal,
      annualProgress.totalWeeks
    );
    setAnnualEmissionGoal(savedGoal);
    setComparisonGoals(current => ({ ...current, [selectedYear]: savedGoal }));
    toast.success(`Meta anual atualizada para ${savedGoal} emissões.`);
  };
  const handleSaveComparisonGoal = (
    comparisonYear: number,
    goal: number,
    totalWeeks: number
  ) => {
    const savedGoal = saveAnnualEmissionGoal(comparisonYear, goal, totalWeeks);
    setComparisonGoals(current => ({ ...current, [comparisonYear]: savedGoal }));
    if (comparisonYear === selectedYear) {
      setAnnualEmissionGoal(savedGoal);
    }
    toast.success(`Meta de ${comparisonYear} atualizada para ${savedGoal} emissões.`);
  };
  const [attentionDismissals, setAttentionDismissals] = useState(() =>
    readAttentionDismissals()
  );
  const activeAttentionItems = useMemo(
    () => attentionItems.filter(item => !attentionDismissals[item.id]),
    [attentionDismissals, attentionItems]
  );
  const dismissedAttentionItems = useMemo(
    () => attentionItems.filter(item => attentionDismissals[item.id]),
    [attentionDismissals, attentionItems]
  );
  const handleDismissAttention = (
    itemId: string,
    durationMs: number,
    durationLabel: string
  ) => {
    setAttentionDismissals(dismissAttentionItem(itemId, durationMs));
    toast.success(`Alerta adiado por ${durationLabel}.`);
  };
  const handleRestoreAttention = (itemId: string) => {
    setAttentionDismissals(restoreAttentionItem(itemId));
    toast.success("Alerta reativado.");
  };
  const showPendingWeeks = () => {
    setFilterTicketStatus("notIssued");
    setShowCheapestOnly(false);
    setExpandFilters(true);
    window.setTimeout(() => {
      document
        .getElementById("filters-content")
        ?.scrollIntoView({ behavior: "smooth", block: "start" });
    }, 80);
  };

  // Soma TODOS os valores em dinheiro pagos na semana (todas as companhias)
  const totalWeekCostMap = useMemo(() => {
    const map: Record<number, number> = {};
    for (const weekStr in priceMap) {
      const weekNumber = parseInt(weekStr);
      const weekPrices = priceMap[weekNumber];
      if (!weekPrices) continue;
      let total = 0;
      let found = false;
      for (const key in weekPrices) {
        const val = parseFloat(weekPrices[key] as string);
        if (!isNaN(val) && val > 0) {
          total += val;
          found = true;
        }
      }
      if (found) map[weekNumber] = total;
    }
    return map;
  }, [priceMap]);

  const getTotalWeekCost = useCallback(
    (weekNumber: number): number | null => {
      const total = totalWeekCostMap[weekNumber];
      return total !== undefined ? total : null;
    },
    [totalWeekCostMap]
  );

  // Calculate price percentile
  const priceThreshold = useMemo(() => {
    const allPrices: number[] = [];
    for (const weekStr in priceMap) {
      const weekPrices = priceMap[parseInt(weekStr)];
      if (!weekPrices) continue;
      for (const airline in weekPrices) {
        const num = parseFloat(weekPrices[airline] as string);
        if (!isNaN(num)) allPrices.push(num);
      }
    }
    if (allPrices.length === 0) return null;
    allPrices.sort((a, b) => a - b);
    const index = Math.floor((pricePercentile / 100) * allPrices.length);
    return allPrices[index] || null;
  }, [priceMap, pricePercentile]);

  // Filter and sort
  const filteredWeeks = useMemo(() => {
    return weeksData.filter(w => {
      if (w.isDeleted) return false;
      if (filterMonth !== "all") {
        const month = w.departureDate.substring(3, 5);
        if (month !== filterMonth) return false;
      }
      if (showCheapestOnly && priceThreshold) {
        const lowest = getLowestPrice(w.weekNumber);
        if (!lowest || lowest > priceThreshold) return false;
      }
      if (filterTicketStatus === "issued" && !w.isTicketIssued) return false;
      if (filterTicketStatus === "notIssued" && w.isTicketIssued) return false;
      // Filtro de companhia: considerar ida OU volta
      if (filterAirline !== "all") {
        const departureMatches = w.departureAirline === filterAirline;
        const returnMatches = w.returnAirline === filterAirline;
        if (!departureMatches && !returnMatches) return false;
      }
      // Filtro de horario: considerar ida OU volta
      // Usa departureFlightDatetime e returnFlightDatetime (formato "2026-02-22T17:55")
      const departureMinutes = getFlightMinutes(w.departureFlightDatetime);
      const returnMinutes = getFlightMinutes(w.returnFlightDatetime);
      // Se o voo não tem horário definido (-1), ele sempre passa no filtro
      const departureMatches =
        departureMinutes === -1 ||
        (departureMinutes >= departureTimeFilter && departureMinutes <= 1439);
      const returnMatches =
        returnMinutes === -1 ||
        (returnMinutes >= returnTimeFilter && returnMinutes <= 1439);
      // Se ambos os filtros estão em 0 (padrão), mostrar todos
      if (departureTimeFilter === 0 && returnTimeFilter === 0) {
        // Sem filtro de horário, mostrar tudo
      } else if (departureTimeFilter > 0 && returnTimeFilter > 0) {
        // Ambos filtros ativos: ida OU volta deve bater
        if (!departureMatches && !returnMatches) return false;
      } else if (departureTimeFilter > 0) {
        // Apenas filtro de ida ativo
        if (!departureMatches) return false;
      } else if (returnTimeFilter > 0) {
        // Apenas filtro de volta ativo
        if (!returnMatches) return false;
      }
      return true;
    });
  }, [
    weeksData,
    filterMonth,
    filterAirline,
    showCheapestOnly,
    priceThreshold,
    filterTicketStatus,
    departureTimeFilter,
    returnTimeFilter,
    getLowestPrice,
  ]);

  const sortedWeeks = useMemo(() => {
    const sorted = [...filteredWeeks];
    if (sortBy === "price") {
      sorted.sort((a, b) => {
        const pa = getLowestPrice(a.weekNumber) ?? Infinity;
        const pb = getLowestPrice(b.weekNumber) ?? Infinity;
        return pa - pb;
      });
    }
    return sorted;
  }, [filteredWeeks, sortBy, getLowestPrice]);

  const deletedWeeks = useMemo(
    () => weeksData.filter(w => w.isDeleted === 1),
    [weeksData]
  );

  // Agrupamento por mês
  const MONTH_NAMES: Record<string, string> = {
    "01": "Janeiro",
    "02": "Fevereiro",
    "03": "Março",
    "04": "Abril",
    "05": "Maio",
    "06": "Junho",
    "07": "Julho",
    "08": "Agosto",
    "09": "Setembro",
    "10": "Outubro",
    "11": "Novembro",
    "12": "Dezembro",
  };

  // ⚡ Bolt Optimization:
  // Pre-calculate monthly derived values (issued, selected, holidays, total) during the `weeksByMonth`
  // memoization to prevent expensive O(N) filtering/reductions inside the render loop for each month group.
  const weeksByMonth = useMemo(() => {
    const groups: {
      monthKey: string;
      monthLabel: string;
      weeks: WeekData[];
      monthIssued: number;
      monthSelected: number;
      monthHasHoliday: boolean;
      monthIssuedTotal: number;
      monthSmilesTotal: number;
      monthLatamPassTotal: number;
    }[] = [];

    const groupMap: Record<string, (typeof groups)[0]> = {};

    for (const week of sortedWeeks) {
      const monthKey = week.departureDate.substring(3, 5);
      if (!groupMap[monthKey]) {
        const newGroup = {
          monthKey,
          monthLabel: MONTH_NAMES[monthKey] || monthKey,
          weeks: [],
          monthIssued: 0,
          monthSelected: 0,
          monthHasHoliday: false,
          monthIssuedTotal: 0,
          monthSmilesTotal: 0,
          monthLatamPassTotal: 0,
        };
        groupMap[monthKey] = newGroup;
        groups.push(newGroup);
      }
      groupMap[monthKey].weeks.push(week);
    }

    // After grouping, compute the aggregates per month once
    // ⚡ Single-pass iteration to avoid multiple array allocations from .filter(), .some(), .reduce()
    for (const group of groups) {
      let issuedCount = 0;
      let selectedCount = 0;
      let hasHoliday = false;
      let issuedTotal = 0;

      let smilesTotal = 0;
      let latamPassTotal = 0;

      for (const w of group.weeks) {
        if (w.isTicketIssued) {
          issuedCount++;
          issuedTotal += getTotalWeekCost(w.weekNumber) ?? 0;
        }
        if (w.isSelected) {
          selectedCount++;
        }
        if (
          !hasHoliday &&
          getFeriadosPorIntervalo(w.weekNumber, w.departureDate, w.returnDate)
            .length > 0
        ) {
          hasHoliday = true;
        }
        if (w.smilesPoints) smilesTotal += w.smilesPoints;
        if (w.latamPassPoints) latamPassTotal += w.latamPassPoints;
      }

      group.monthIssued = issuedCount;
      group.monthSelected = selectedCount;
      group.monthHasHoliday = hasHoliday;
      group.monthIssuedTotal = issuedTotal;
      group.monthSmilesTotal = smilesTotal;
      group.monthLatamPassTotal = latamPassTotal;
    }

    return groups;
  }, [sortedWeeks, getTotalWeekCost]);

  // Mês corrente para iniciar expandido
  const currentMonthKey = useMemo(() => {
    const now = new Date();
    return String(now.getMonth() + 1).padStart(2, "0");
  }, []);

  const [expandedMonths, setExpandedMonths] = useState<Set<string>>(
    () => new Set([currentMonthKey])
  );

  const toggleMonth = (monthKey: string) => {
    setExpandedMonths(prev => {
      const next = new Set(prev);
      if (next.has(monthKey)) next.delete(monthKey);
      else next.add(monthKey);
      return next;
    });
  };
  const monthKeys = useMemo(
    () => weeksByMonth.map(month => month.monthKey),
    [weeksByMonth]
  );
  const allMonthsExpanded = areAllMonthsExpanded(monthKeys, expandedMonths);
  const toggleAllMonths = () => {
    setExpandedMonths(previous => getNextExpandedMonths(monthKeys, previous));
  };

  // Semana vigente: encontrar a semana cujo intervalo de datas contém a data atual
  const currentWeekNumber = useMemo(() => {
    const now = new Date();
    for (const w of weeksData) {
      if (w.departureDate.length === 10 && w.returnDate.length === 10) {
        const dep = new Date(
          +w.departureDate.substring(6, 10),
          +w.departureDate.substring(3, 5) - 1,
          +w.departureDate.substring(0, 2)
        );
        const ret = new Date(
          +w.returnDate.substring(6, 10),
          +w.returnDate.substring(3, 5) - 1,
          +w.returnDate.substring(0, 2)
        );
        // Expandir janela: 3 dias antes da ida até 1 dia depois da volta
        dep.setDate(dep.getDate() - 3);
        ret.setDate(ret.getDate() + 1);
        if (now >= dep && now <= ret) return w.weekNumber;
      }
    }
    // Fallback: próxima semana futura
    for (const w of weeksData) {
      if (w.departureDate.length === 10) {
        const dep = new Date(
          +w.departureDate.substring(6, 10),
          +w.departureDate.substring(3, 5) - 1,
          +w.departureDate.substring(0, 2)
        );
        if (dep >= now) return w.weekNumber;
      }
    }
    return null;
  }, [weeksData]);

  // Inicializa o accordion: semanas futuras/atuais abertas, passadas fechadas
  const getInitialExpandedWeeks = () => {
    const now = new Date();
    now.setHours(0, 0, 0, 0);
    const expanded = new Set<number>();
    for (const w of weeksData) {
      if (w.departureDate && w.departureDate.length === 10) {
        const dep = parseBR(w.departureDate);
        // Abre semanas cujo voo de ida ainda não passou (ou é hoje)
        if (!isNaN(dep.getTime()) && dep >= now) {
          expanded.add(w.weekNumber);
        }
      }
    }
    // Se nenhuma semana futura, abre apenas a mais recente
    if (expanded.size === 0 && currentWeekNumber) {
      expanded.add(currentWeekNumber);
    }
    return expanded;
  };

  const [expandedWeekCards, setExpandedWeekCards] = useState<Set<number>>(
    () => new Set<number>()
  );
  const [additionalFlightCreateRequest, setAdditionalFlightCreateRequest] =
    useState<{ weekNumber: number; requestId: number } | null>(null);
  const weekCardsInitialized = useRef(false);

  // Inicializa accordion quando os dados de semanas carregarem
  useEffect(() => {
    if (!weekCardsInitialized.current && weeksData.length > 0) {
      weekCardsInitialized.current = true;
      setExpandedWeekCards(getInitialExpandedWeeks());
    }
  }, [weeksData]);

  const toggleWeekCard = (weekNumber: number) => {
    setExpandedWeekCards(prev => {
      const next = new Set(prev);
      if (next.has(weekNumber)) next.delete(weekNumber);
      else next.add(weekNumber);
      return next;
    });
  };

  const requestAdditionalFlight = (weekNumber: number) => {
    setExpandedWeekCards(previous => {
      const next = new Set(previous);
      next.add(weekNumber);
      return next;
    });
    setAdditionalFlightCreateRequest(previous => ({
      weekNumber,
      requestId: (previous?.requestId ?? 0) + 1,
    }));
  };

  const openAttentionWeek = (weekNumber: number) => {
    const week = weeksData.find(item => item.weekNumber === weekNumber);
    if (!week) return;

    const monthKey = week.departureDate.substring(3, 5);
    setFilterMonth(monthKey);
    setFilterAirline("all");
    setFilterTicketStatus("all");
    setShowCheapestOnly(false);
    setExpandedMonths(previous => new Set(previous).add(monthKey));
    setExpandedWeekCards(previous => new Set(previous).add(weekNumber));

    window.setTimeout(() => {
      document
        .getElementById(`week-card-${weekNumber}`)
        ?.scrollIntoView({ behavior: "smooth", block: "center" });
    }, 80);
  };

  useEffect(() => {
    if (!isManagementView || weeksData.length === 0) return;
    const weekNumber = Number(new URLSearchParams(window.location.search).get("week"));
    if (!Number.isInteger(weekNumber) || weekNumber < 1 || weekNumber > 53) return;
    const week = weeksData.find(item => item.weekNumber === weekNumber);
    if (!week) return;

    const monthKey = week.departureDate.substring(3, 5);
    setFilterMonth(monthKey);
    setFilterAirline("all");
    setFilterTicketStatus("all");
    setShowCheapestOnly(false);
    setExpandedMonths(previous => new Set(previous).add(monthKey));
    setExpandedWeekCards(previous => new Set(previous).add(weekNumber));

    const timeout = window.setTimeout(() => {
      document
        .getElementById(`week-card-${weekNumber}`)
        ?.scrollIntoView({ behavior: "smooth", block: "center" });
    }, 120);
    return () => window.clearTimeout(timeout);
  }, [isManagementView, weeksData]);

  const expandAllWeeks = () => {
    const allWeekNumbers = new Set(weeksData.map(w => w.weekNumber));
    setExpandedWeekCards(allWeekNumbers);
  };

  const collapseAllWeeks = () => {
    setExpandedWeekCards(new Set());
  };

  const toggleAllWeeks = () => {
    if (expandedWeekCards.size === weeksData.length) {
      collapseAllWeeks();
    } else {
      expandAllWeeks();
    }
  };
  // ⚡ Bolt Optimization: Combine selectedWeeks, issuedCount, and totalCost into a single pass
  // to avoid multiple O(N) loops and intermediate array allocations (.filter, .reduce)
  const { selectedWeeks, issuedCount, totalCost, totalSmiles, totalLatamPass } =
    useMemo(() => {
      const selected: WeekData[] = [];
      let count = 0;
      let cost = 0;
      let smiles = 0;
      let latamPass = 0;

      for (let i = 0; i < weeksData.length; i++) {
        const w = weeksData[i];
        if (w.isSelected === 1) {
          selected.push(w);
          if (w.isTicketIssued) {
            count++;
          }
          cost += getTotalWeekCost(w.weekNumber) ?? 0;
          if (w.smilesPoints) smiles += w.smilesPoints;
          if (w.latamPassPoints) latamPass += w.latamPassPoints;
        }
      }

      return {
        selectedWeeks: selected,
        issuedCount: count,
        totalCost: cost,
        totalSmiles: smiles,
        totalLatamPass: latamPass,
      };
    }, [weeksData, getTotalWeekCost]);

  // Dados para o gráfico de variação de preços por mês (todas as empresas)
  const chartData = useMemo(() => {
    // ⚡ Bolt: Single-pass iteration to avoid multiple array allocations from .filter()
    // Initialize accumulator for each month
    const monthStats: Record<
      string,
      {
        mes: string;
        airlines: Record<string, { sum: number; count: number }>;
        minPrice: number;
        totalAll: number;
        countAll: number;
      }
    > = {};

    for (let i = 0; i < CHART_MONTHS.length; i++) {
      const monthNum = CHART_MONTHS[i].num;
      monthStats[monthNum] = {
        mes: CHART_MONTHS[i].label,
        airlines: {},
        minPrice: Infinity,
        totalAll: 0,
        countAll: 0,
      };
      for (const airline of airlines) {
        monthStats[monthNum].airlines[airline.id] = { sum: 0, count: 0 };
      }
    }

    // Single pass over weeksData
    for (let i = 0; i < weeksData.length; i++) {
      const w = weeksData[i];
      if (w.isDeleted) continue;

      const monthNum = w.departureDate.substring(3, 5);
      const stats = monthStats[monthNum];
      if (!stats) continue;

      // Update airline averages
      const weekPrices = priceMap[w.weekNumber];
      if (weekPrices) {
        for (const airline of airlines) {
          const p = parseFloat((weekPrices[airline.id] as string) || "");
          if (!isNaN(p) && p > 0) {
            stats.airlines[airline.id].sum += p;
            stats.airlines[airline.id].count++;
          }
        }
      }

      // Update month min and average
      const lowestP = getLowestPrice(w.weekNumber);
      if (lowestP !== null && lowestP > 0) {
        if (lowestP < stats.minPrice) stats.minPrice = lowestP;
        stats.totalAll += lowestP;
        stats.countAll++;
      }
    }

    // Format output exactly as expected
    const result: MonthlyChartData[] = [];
    for (let i = 0; i < CHART_MONTHS.length; i++) {
      const stats = monthStats[CHART_MONTHS[i].num];
      const entry: MonthlyChartData = { mes: stats.mes };

      for (const airline of airlines) {
        const airStats = stats.airlines[airline.id];
        if (airStats.count > 0) {
          entry[airline.id] = Math.round(airStats.sum / airStats.count);
        }
      }

      if (stats.countAll > 0) {
        entry["menor"] = Math.round(stats.minPrice);
        entry["media"] = Math.round(stats.totalAll / stats.countAll);
      }

      result.push(entry);
    }

    return result;
  }, [weeksData, priceMap, getLowestPrice]);

  const hasChartData = chartData.some(d => Object.keys(d).length > 1);

  // ⚡ Bolt Optimization: Pre-calculate and group holidays per week once when weeksData changes.
  // This prevents executing getFeriadosPorIntervalo (which iterates over all holidays)
  // and allocating multiple grouped arrays 44 times on EVERY render cycle (e.g., during input typing).
  const feriadosByWeek = useMemo(() => {
    const map: Record<
      number,
      {
        feriados: FeriadoInfo[];
        feriadoIda: FeriadoInfo[];
        feriadoRetorno: FeriadoInfo[];
        feriadosIntervaloCopa: FeriadoInfo[];
        feriadosIntervaloNaoCopa: FeriadoInfo[];
        jogosDosBrasil: typeof todosJogosParsed;
        fasesEliminatorias: typeof todasFasesParsed;
      }
    > = {};

    for (const w of weeksData) {
      const feriados = getFeriadosPorIntervalo(
        w.weekNumber,
        w.departureDate,
        w.returnDate
      );
      const feriadoIda: FeriadoInfo[] = [];
      const feriadoRetorno: FeriadoInfo[] = [];
      const feriadosIntervaloCopa: FeriadoInfo[] = [];
      const feriadosIntervaloNaoCopa: FeriadoInfo[] = [];

      for (const f of feriados) {
        if (f.tipo === "ida") feriadoIda.push(f);
        else if (f.tipo === "retorno") feriadoRetorno.push(f);
        else if (f.tipo === "intervalo") {
          if (f.feriado.tipo === "copa") feriadosIntervaloCopa.push(f);
          else feriadosIntervaloNaoCopa.push(f);
        }
      }

      const semanaInicio = parseBR(w.departureDate);
      const semanaFimViagem = parseBR(w.returnDate);
      const semanaFim = new Date(semanaInicio);
      semanaFim.setDate(semanaFim.getDate() + 6);
      const semanaFimEfetivo =
        semanaFimViagem > semanaFim ? semanaFimViagem : semanaFim;

      const semanaInicioMs = semanaInicio.getTime();
      const semanaFimEfetivoMs = semanaFimEfetivo.getTime();

      const jogosDosBrasil: typeof todosJogosParsed = [];
      for (const jogo of todosJogosParsed) {
        if (jogo.dataMs >= semanaInicioMs && jogo.dataMs <= semanaFimEfetivoMs) {
          jogosDosBrasil.push(jogo);
        }
      }

      const fasesEliminatorias: typeof todasFasesParsed = [];
      for (const fase of todasFasesParsed) {
        if (fase.inicioMs <= semanaFimEfetivoMs && fase.fimMs >= semanaInicioMs) {
          fasesEliminatorias.push(fase);
        }
      }

      map[w.weekNumber] = {
        feriados,
        feriadoIda,
        feriadoRetorno,
        feriadosIntervaloCopa,
        feriadosIntervaloNaoCopa,
        jogosDosBrasil,
        fasesEliminatorias,
      };
    }
    return map;
  }, [weeksData]);

  // ⚡ Bolt Optimization: Consolidate multiple O(N) loops into a single pass
  // Dados do resumo anual: total emitido por mês e totais anuais
  const {
    annualSummaryData,
    annualTotalIssued,
    annualIssuedCount,
    annualSmilesTotal,
    annualLatamPassTotal,
  } = useMemo(() => {
    const summaryMap: Record<
      string,
      { mes: string; total: number; count: number }
    > = {};
    for (let i = 0; i < CHART_MONTHS.length; i++) {
      summaryMap[CHART_MONTHS[i].num] = { mes: CHART_MONTHS[i].label, total: 0, count: 0 };
    }

    let totalIssued = 0;
    let issuedCount = 0;
    let smilesTotal = 0;
    let latamPassTotal = 0;

    for (let i = 0; i < weeksData.length; i++) {
      const w = weeksData[i];
      if (!w.isDeleted) {
        if (w.isTicketIssued) {
          const weekTotal = getTotalWeekCost(w.weekNumber) ?? 0;

          totalIssued += weekTotal;
          issuedCount++;

          const monthNum = w.departureDate.substring(3, 5);
          if (summaryMap[monthNum]) {
            summaryMap[monthNum].total += weekTotal;
            summaryMap[monthNum].count += 1;
          }
        }
        if (w.smilesPoints) smilesTotal += w.smilesPoints;
        if (w.latamPassPoints) latamPassTotal += w.latamPassPoints;
      }
    }

    const summaryResult = [];
    for (let i = 0; i < CHART_MONTHS.length; i++) {
      const s = summaryMap[CHART_MONTHS[i].num];
      summaryResult.push({
        mes: s.mes,
        total: s.total > 0 ? Math.round(s.total * 100) / 100 : 0,
        count: s.count,
      });
    }

    return {
      annualSummaryData: summaryResult,
      annualTotalIssued: totalIssued,
      annualIssuedCount: issuedCount,
      annualSmilesTotal: smilesTotal,
      annualLatamPassTotal: latamPassTotal,
    };
  }, [weeksData, getTotalWeekCost]);

  const annualHasData = annualSummaryData.some(d => d.total > 0);

  const decisionQueue = useMemo(
    () => buildDecisionItemQueue(
      weeksData,
      priceMap,
      new Date(),
      decisionCenterPreferences.relevanceByWeek
    ),
    [weeksData, priceMap, decisionCenterPreferences.relevanceByWeek]
  );
  const decisionItems = decisionQueue.slice(0, 3);
  const secondaryDecisionItems = decisionQueue.slice(3);
  const nextDecisionTrip = useMemo(
    () => getNextDecisionTrip(weeksData),
    [weeksData]
  );
  const nextDecisionTrips = useMemo(
    () => getNextDecisionTrips(weeksData),
    [weeksData]
  );
  useEffect(() => {
    if (!weeksQuery.data?.length || !nextDecisionTrips.length) return;
    saveOfflineNextTrips(selectedYear, nextDecisionTrips);
    setOfflineNextTrips(readOfflineNextTrips(selectedYear));
  }, [nextDecisionTrips, selectedYear, weeksQuery.data]);
  const pendingDecisionWeeks = useMemo(
    () => weeksData.filter(week => !week.isDeleted && !week.isTicketIssued).length,
    [weeksData]
  );
  const decisionAverageTrip = annualIssuedCount > 0
    ? annualTotalIssued / annualIssuedCount
    : null;
  const openDecisionManagementWeek = useCallback((weekNumber: number) => {
    window.location.assign(`/gestao-passagens?week=${weekNumber}`);
  }, []);
  const openDecisionCalendarWeek = useCallback((weekNumber: number) => {
    window.location.assign(`/calendar?week=${weekNumber}`);
  }, []);
  const adjustDecisionRelevance = useCallback(
    (weekNumber: number, direction: "raise" | "lower") => {
      setDecisionCenterPreferences(previous =>
        adjustDecisionWeekRelevance(previous, weekNumber, direction)
      );
    },
    []
  );

  // Handlers
  const handleToggleSelect = (weekNumber: number, current: number) => {
    requireAuth(() => {
      updateStatusMutation.mutate(
        { year: selectedYear, weekNumber, isSelected: current ? 0 : 1 },
        {
          onSuccess: () => void invalidatePlanningAndFinancialYear(),
        }
      );
    });
  };

  const handleDelete = (weekNumber: number) => {
    requireAuth(() => {
      updateStatusMutation.mutate(
        { year: selectedYear, weekNumber, isDeleted: 1 },
        {
          onSuccess: () => {
            void invalidatePlanningAndFinancialYear();
            toast.success(`Semana ${weekNumber} excluída`);
          },
        }
      );
    });
  };

  const handleRestore = (weekNumber: number) => {
    requireAuth(() => {
      updateStatusMutation.mutate(
        { year: selectedYear, weekNumber, isDeleted: 0 },
        {
          onSuccess: () => {
            void invalidatePlanningAndFinancialYear();
            toast.success(`Semana ${weekNumber} restaurada`);
          },
        }
      );
    });
  };

  // Converte DD/MM/YYYY para YYYY-MM-DD (formato aceito pelo input datetime-local)
  const toInputDate = (dateStr: string): string => {
    if (!dateStr || dateStr.length !== 10) return "";
    return `${dateStr.substring(6, 10)}-${dateStr.substring(3, 5)}-${dateStr.substring(0, 2)}`;
  };

  const handleToggleTicket = (weekNumber: number, current: number) => {
    requireAuth(() => {
      // Ao abrir o card (marcar como emitido), pré-preencher as datas da semana
      if (!current) {
        const week = weeksData.find(w => w.weekNumber === weekNumber);
        if (week) {
          const depDate = toInputDate(week.departureDate);
          const retDate = toInputDate(week.returnDate);

          // Para o campo de IDA: usar a data do date-picker inline (depDate).
          // Se já existir horário salvo no banco, preservá-lo; caso contrário, usar 00:00.
          const savedDep = week.departureFlightDatetime ?? "";
          const savedDepTime =
            savedDep.includes("T") && savedDep.length > 10
              ? savedDep.split("T")[1]
              : "00:00";
          setTempDepartureDatetime(prev => ({
            ...prev,
            [weekNumber]: depDate ? `${depDate}T${savedDepTime}` : "",
          }));

          // Para o campo de VOLTA: usar a data do date-picker inline (retDate).
          // Se já existir horário salvo no banco, preservá-lo; caso contrário, usar 00:00.
          const savedRet = week.returnFlightDatetime ?? "";
          const savedRetTime =
            savedRet.includes("T") && savedRet.length > 10
              ? savedRet.split("T")[1]
              : "00:00";
          setTempReturnDatetime(prev => ({
            ...prev,
            [weekNumber]: retDate ? `${retDate}T${savedRetTime}` : "",
          }));
        }
      }

      updateStatusMutation.mutate(
        { year: selectedYear, weekNumber, isTicketIssued: current ? 0 : 1 },
        {
          onSuccess: () => {
            void invalidatePlanningAndFinancialYear();
            toast.success(
              current
                ? "Bilhete marcado como não emitido"
                : "Bilhete marcado como emitido"
            );
          },
        }
      );
    });
  };

  const handlePriceBlur = (
    weekNumber: number,
    airline: string,
    value: string
  ) => {
    if (!isAuthenticated) {
      setShowLoginModal(true);
      return;
    }
    setSavingPrice({ week: weekNumber, airline });
    savePriceMutation.mutate(
      { year: selectedYear, weekNumber, airline, price: value },
      {
        onSuccess: () => {
          void invalidatePricesAndFinancialYear();
          setSavingPrice(null);
        },
        onError: err => {
          setSavingPrice(null);
          if (err.message?.includes("login")) setShowLoginModal(true);
        },
      }
    );
  };

  const handleMilesBlur = (
    weekNumber: number,
    field: "smilesPoints" | "latamPassPoints",
    value: string
  ) => {
    if (!isAuthenticated) {
      setShowLoginModal(true);
      return;
    }
    const numValue = value === "" ? null : parseInt(value, 10);
    if (value !== "" && isNaN(numValue as number)) return;
    setSavingMiles({ week: weekNumber, field });
    updateStatusMutation.mutate(
      { year: selectedYear, weekNumber, [field]: numValue },
      {
        onSuccess: () => {
          void invalidatePlanningAndFinancialYear();
          setSavingMiles(null);
        },
        onError: () => {
          setSavingMiles(null);
        },
      }
    );
  };

  const isLoading =
    weeksQuery.isLoading ||
    pricesQuery.isLoading ||
    publicPricesQuery.isLoading;
  const isHomeInitialLoading =
    !isManagementView &&
    (isLoading ||
      authCheckQuery.isLoading ||
      (isAuthenticated && additionalFlightsQuery.isLoading));
  const isRefreshingFlightData =
    !isLoading &&
    !isRefreshing &&
    (weeksQuery.isFetching ||
      pricesQuery.isFetching ||
      publicPricesQuery.isFetching ||
      additionalFlightsQuery.isFetching);
  const hasLocalPlanningData = (weeksQuery.data?.length ?? 0) > 0;
  const shouldShowOfflineRecovery =
    !isManagementView && !isOnline && !hasLocalPlanningData;
  const decisionCenterSection = !weeksQuery.isLoading ? (
    <DecisionCenter
      items={decisionItems}
      secondaryItems={secondaryDecisionItems}
      isExpanded={decisionCenterPreferences.isExpanded}
      isPinned={decisionCenterPreferences.isPinned}
      secondaryQueueOpen={decisionCenterPreferences.secondaryQueueOpen}
      nextTrip={nextDecisionTrip}
      isLoading={weeksQuery.isLoading}
      hasError={weeksQuery.isError}
      onRetry={() => void weeksQuery.refetch()}
      onToggleExpanded={toggleDecisionCenterExpansion}
      onTogglePinned={toggleDecisionCenterPin}
      onToggleSecondaryQueue={() =>
        setDecisionCenterPreferences(previous => ({
          ...previous,
          secondaryQueueOpen: !previous.secondaryQueueOpen,
        }))
      }
      onAdjustRelevance={adjustDecisionRelevance}
      onOpenManagementWeek={openDecisionManagementWeek}
      onOpenCalendarWeek={openDecisionCalendarWeek}
      metrics={{
        issuedCount: annualIssuedCount,
        pendingCount: pendingDecisionWeeks,
        annualTotal: hideValues
          ? "••••"
          : `R$ ${annualTotalIssued.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
        averageTrip: hideValues
          ? "••••"
          : decisionAverageTrip === null
            ? "—"
            : `R$ ${decisionAverageTrip.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
      }}
    />
  ) : null;

  return (
    <div
      className={`min-h-screen font-sans tracking-tight transition-colors duration-300 ${
        theme === "dark"
          ? "bg-slate-900 text-slate-100"
          : "bg-slate-50 text-slate-800"
      }`}
    >
      {/* Pull-to-refresh indicator */}
      {(isPulling || isRefreshing) && (
        <div
          className="fixed top-0 left-0 right-0 z-30 flex items-center justify-center transition-all duration-200 pointer-events-none"
          style={{
            height: isRefreshing ? "52px" : `${Math.max(pullDistance, 0)}px`,
            paddingTop: "env(safe-area-inset-top)",
            background: "linear-gradient(to bottom, #2563eb, #1d4ed8)",
            transform: isRefreshing ? "translateY(0)" : undefined,
          }}
        >
          <div className="flex items-center gap-2 text-white">
            <RotateCw
              className={`w-5 h-5 ${isRefreshing ? "animate-spin" : ""}`}
              style={{
                transform: !isRefreshing
                  ? `rotate(${Math.min((pullDistance / 80) * 360, 360)}deg)`
                  : undefined,
                transition: isRefreshing ? undefined : "transform 0.05s linear",
              }}
            />
            {isRefreshing && (
              <span className="text-sm font-medium">Atualizando...</span>
            )}
            {!isRefreshing && pullDistance >= 80 && (
              <span className="text-sm font-medium">Solte para atualizar</span>
            )}
            {!isRefreshing && pullDistance < 80 && pullDistance > 20 && (
              <span className="text-sm font-medium">Puxe para atualizar</span>
            )}
          </div>
        </div>
      )}
      {/* Last Update Timestamp */}
      <div
        className={`text-center text-xs transition-all duration-300 ${
          theme === "dark" ? "text-slate-400" : "text-slate-500"
        }`}
        style={{
          paddingTop: "8px",
          paddingBottom: "8px",
          minHeight: "24px",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          gap: "6px",
        }}
      >
        {weeksQuery.isLoading ? (
          <div key="loading" className="fade-in flex items-center gap-2">
            <Loader2 className="w-3 h-3 animate-spin motion-reduce:animate-none" />
            <span>Atualizando dados...</span>
          </div>
        ) : !isOnline ? (
          <div key="offline" className="fade-in flex items-center gap-2" role="status" aria-live="polite" data-offline-status="true">
            <WifiOff className="size-3" aria-hidden="true" />
            <span>
              Modo offline{lastPlanningSyncAt ? ` · Última sincronização: ${formatPlanningSyncTimestamp(lastPlanningSyncAt)}` : " · Sem sincronização local"}
            </span>
          </div>
        ) : isRefreshingFlightData ? (
          <div
            key="refreshing"
            className="fade-in flex items-center gap-2"
            role="status"
            aria-live="polite"
            data-flight-refreshing="true"
          >
            <Loader2 className="w-3 h-3 animate-spin motion-reduce:animate-none" aria-hidden="true" />
            <span>Atualizando dados de voo...</span>
          </div>
        ) : (
          <div key="loaded" className="fade-in">
            Última atualização: {formatLastUpdate(lastUpdateTime)}
          </div>
        )}
      </div>
      {/* Hero Header */}
      <header
        className={`relative shadow-xl sticky top-0 z-40 overflow-hidden transition-colors duration-300 ${
          theme === "dark" ? "bg-slate-800" : "bg-white"
        }`}
        style={{
          paddingTop: `calc(env(safe-area-inset-top) + ${Math.max(pullDistance, 0)}px)`,
          transition: "padding-top 0.1s ease-out",
        }}
      >
        {/* Background with Preset Gradient */}
        <div
          className="absolute inset-0 z-0 bg-cover bg-center transition-all duration-500"
          style={{
            backgroundImage:
              theme === "dark"
                ? `linear-gradient(135deg, var(--preset-header-from, #0f172a) 0%, var(--preset-header-to, #1e3a5f) 100%)`
                : "url('https://images.unsplash.com/photo-1436491865332-7a61a109cc05?q=80&w=2074&auto=format&fit=crop')",
          }}
        >
          <div
            className="absolute inset-0 backdrop-blur-[2px] transition-all duration-500"
            style={{
              background:
                theme === "dark"
                  ? `var(--preset-header-overlay, rgba(15,23,42,0.75))`
                  : `linear-gradient(135deg, var(--preset-header-overlay, rgba(15,23,42,0.75)) 0%, rgba(0,0,0,0.3) 100%)`,
            }}
          ></div>
        </div>

        <div className="container relative z-10 py-4 sm:py-6">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex items-center gap-2 sm:gap-3">
              <Tooltip>
                <TooltipTrigger asChild>
                  <Link
                    href="/"
                    aria-label="Voltar para a página inicial pelo logo Smart Fly"
                    className="group shrink-0 rounded-xl transition-[transform,filter] duration-200 ease-out hover:-translate-y-0.5 hover:scale-[1.04] hover:drop-shadow-[0_8px_14px_rgba(14,165,233,0.32)] active:scale-[0.97] motion-reduce:transition-none motion-reduce:hover:transform-none focus:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-slate-800"
                  >
                    <img
                      src="/smartfly-assets/smartfly-sf-apple-touch-icon_598faae4.png?v=20260827"
                      alt=""
                      aria-hidden="true"
                      className="h-10 w-10 rounded-xl object-contain transition-transform duration-200 group-hover:rotate-[-2deg] motion-reduce:transition-none sm:h-12 sm:w-12"
                    />
                  </Link>
                </TooltipTrigger>
                <TooltipContent side="bottom" sideOffset={10}>
                  Voltar para a página inicial
                </TooltipContent>
              </Tooltip>
              <Link
                href="/"
                aria-label="Voltar para a página inicial"
                className="inline-flex flex-col rounded-lg focus:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-slate-800"
              >
                <h1 className="text-xl sm:text-4xl font-bold leading-tight tracking-tight text-white drop-shadow-md">
                  Smart Fly
                </h1>
                <p className="text-slate-200 text-xs sm:text-sm font-medium tracking-wide">
                  Viagens
                </p>
              </Link>
            </div>
            <HomeHeaderActions
              selectedYear={selectedYear}
              theme={theme}
              colorPreset={colorPreset}
              colorPresetOptions={COLOR_PRESETS}
              navyIntensity={navyIntensity}
              hideValues={hideValues}
              pushStatus={pushStatus}
              pushSubscribed={pushSubscribed}
              pushLoading={pushLoading}
              isAuthenticated={isAuthenticated}
              isAdmin={authCheckQuery.data?.isAdmin ?? false}
              accountEmail={authCheckQuery.data?.email}
              notificationSettings={
                <NotificationSettingsPopup
                  isAuthenticated={isAuthenticated}
                  onLoginRequired={() => setShowLoginModal(true)}
                  triggerClassName="h-10 w-10 rounded-xl border border-white/35 bg-slate-950/20 px-0 text-white shadow-sm backdrop-blur-md transition-[transform,background-color,border-color] duration-150 hover:border-white/70 hover:bg-white/18 active:scale-[0.97] focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-slate-800"
                />
              }
              pdfExport={
                <DeferredPdfExportButton
                  year={selectedYear}
                  weeksData={weeksData}
                  priceMap={priceMap}
                  totalInvested={annualTotalIssued}
                />
              }
              installGuide={<PwaInstallGuide isAuthenticated={isAuthenticated} />}
              onShowChart={() => {
                setIsPriceChartVisible(true);
                requestAnimationFrame(() => {
                  document
                    .getElementById("price-chart-section")
                    ?.scrollIntoView({ behavior: "smooth", block: "start" });
                });
              }}
              onToggleTheme={() => toggleTheme?.()}
              onColorPresetChange={value => setColorPreset(value as ColorPreset)}
              onNavyIntensityChange={setNavyIntensity}
              onToggleValues={toggleHideValues}
              onToggleNotifications={async () => {
                if (!isAuthenticated) {
                  setShowLoginModal(true);
                  return;
                }
                if (pushSubscribed) {
                  await pushUnsubscribe();
                  toast.success("Notificações desativadas.");
                } else {
                  await pushSubscribe();
                  if (pushStatus !== "denied") {
                    toast.success(
                      "Notificações ativadas! Você será avisado 24h antes de cada voo."
                    );
                  }
                }
              }}
          onSignIn={() => setShowLoginModal(true)}
          onSignOut={handleLogout}
          mobilePrimaryAction={homeDashboardPreferences.mobilePrimaryAction}
          onMobilePrimaryActionChange={mobilePrimaryAction =>
            persistDashboardPreferences({ ...homeDashboardPreferences, mobilePrimaryAction })
          }
        />
          </div>
        </div>
      </header>

      <main className="container py-4 sm:py-8">
        {weeksQuery.isError && !shouldShowOfflineRecovery && (
          <Card
            role="alert"
            className="mb-4 flex flex-col gap-3 border-amber-300 bg-amber-50 p-4 text-amber-950 shadow-sm dark:border-amber-700 dark:bg-amber-950/30 dark:text-amber-50 sm:mb-6 sm:flex-row sm:items-center sm:justify-between"
          >
            <div className="flex items-start gap-3">
              <AlertCircle className="mt-0.5 size-5 shrink-0 text-amber-700 dark:text-amber-300" aria-hidden="true" />
              <div>
                <p className="font-semibold">Não foi possível atualizar o planejamento agora.</p>
                <p className="mt-1 text-sm text-amber-900/85 dark:text-amber-100/80">
                  Seus dados não foram substituídos. Tente carregar novamente em alguns instantes.
                </p>
              </div>
            </div>
            <Button
              type="button"
              variant="outline"
              onClick={() => void weeksQuery.refetch()}
              disabled={weeksQuery.isFetching}
              className="shrink-0 border-amber-500 bg-white text-amber-950 hover:bg-amber-100 dark:bg-transparent dark:text-amber-50 dark:hover:bg-amber-900/50"
            >
              <RotateCw className={`mr-2 size-4 ${weeksQuery.isFetching ? "animate-spin" : ""}`} aria-hidden="true" />
              Tentar novamente
            </Button>
          </Card>
        )}
        {!isManagementView && (
          shouldShowOfflineRecovery ? (
            <HomeOfflineRecovery
              year={selectedYear}
              lastSyncedAt={lastPlanningSyncAt}
              cachedTrips={offlineNextTrips}
              isRetrying={weeksQuery.isFetching}
              onRetry={() => void weeksQuery.refetch()}
            />
          ) : isHomeInitialLoading ? (
            <HomeInitialLoadingSkeleton year={selectedYear} />
          ) : (
          <ContentReveal className="space-y-5 sm:space-y-7">
            {LAYOUT_CONTROLS_ENABLED && (
              <HomeDashboardControls
                theme={theme}
                profile={homeDashboardPreferences.profile}
                pinnedPanels={homeDashboardPreferences.pinnedPanels}
                allPanelsOpen={allHomePanelsAreOpen}
                onProfileChange={applyHomeLayoutProfile}
                onToggleAll={toggleAllHomePanels}
                onTogglePriority={togglePriorityPanel}
                onMovePriority={movePriorityPanel}
                onReorderPriorities={reorderPriorityPanelByDrop}
                onRestoreDefaultOrder={restorePriorityDefaultOrder}
                prioritySets={homeDashboardPreferences.prioritySets}
                onSavePrioritySet={savePrioritySet}
                onApplyPrioritySet={applyPrioritySet}
                onDeletePrioritySet={deletePrioritySet}
              />
            )}
        {decisionCenterPreferences.isPinned && decisionCenterSection}
        {/* Resumo Anual com Accordion */}
        {weeksQuery.isLoading ? (
          <SkeletonChart />
        ) : (
          <div className="mb-4 animate-in fade-in duration-500 motion-reduce:animate-none sm:mb-8">
            <button
              onClick={() => {
                setExpandSummary(!expandSummary);
                markDashboardLayoutAsCustom();
              }}
              className="w-full flex items-center justify-between px-4 sm:px-6 py-3 sm:py-4 bg-gradient-to-r from-slate-900 via-[#071a36] to-slate-900 text-white rounded-3xl hover:from-slate-800 hover:via-[#0b2349] hover:to-slate-800 transition-colors shadow-lg focus:outline-none focus-visible:ring-2 focus-visible:ring-white"
              aria-label="Expandir/Recolher Resumo Anual"
              aria-expanded={expandSummary}
              aria-controls="summary-content"
            >
              <span className="text-lg font-bold">
                Resumo Anual {selectedYear}
              </span>
              {expandSummary ? (
                <ChevronUp className="w-5 h-5" />
              ) : (
                <ChevronDown className="w-5 h-5" />
              )}
            </button>
            {expandSummary && (
              <Card
                id="summary-content"
                className="p-4 sm:p-6 mb-4 sm:mb-8 bg-gradient-to-br from-[#071a36] via-[#102f61] to-[#17427e] text-white rounded-b-3xl rounded-t-none relative overflow-hidden shadow-2xl"
              >
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 mb-4 sm:mb-6">
                  <div>
                    <h2 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
                      Resumo Anual {selectedYear}
                    </h2>
                    <p className="text-slate-200 text-xs sm:text-sm mt-1">
                      Passagens emitidas — GRU / CGH → NVT
                    </p>
                  </div>
                  <div className="flex flex-wrap gap-3 sm:gap-6">
                    <MetricCard variant="transparent" title="Bilhetes Emitidos" value={String(annualIssuedCount)} valueClassName="text-cyan-300 sm:text-4xl" />
                    <MetricCard variant="transparent" title="Total Investido" value={hideValues ? "••••" : `R$ ${annualTotalIssued.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`} valueClassName="text-emerald-200 sm:text-4xl" />
                    <MetricCard variant="transparent" title="Média por Viagem" value={hideValues ? "••••" : annualIssuedCount > 0 ? `R$ ${(annualTotalIssued / annualIssuedCount).toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` : "—"} valueClassName="text-amber-200 sm:text-4xl" />
                    {annualSmilesTotal > 0 && (
                      <MetricCard variant="transparent" title="Total SMILES" value={hideValues ? "••••" : `${annualSmilesTotal.toLocaleString("pt-BR")} pts`} valueClassName="text-orange-300 sm:text-3xl" />
                    )}
                    {annualLatamPassTotal > 0 && (
                      <MetricCard variant="transparent" title="Total LATAM PASS" value={hideValues ? "••••" : `${annualLatamPassTotal.toLocaleString("pt-BR")} pts`} valueClassName="text-red-300 sm:text-3xl" />
                    )}
                  </div>
                </div>
                {shouldRenderDeferredCharts(
                  annualHasData,
                  isAnnualChartVisible
                ) ? (
                  <div>
                    <p className="text-slate-300 text-xs uppercase tracking-wider mb-3">
                      Gasto por Mês (R$)
                    </p>
                    <Suspense fallback={<SkeletonChart />}>
                      <AnnualSpendChart
                        data={annualSummaryData}
                        theme={theme}
                        hideValues={hideValues}
                      />
                    </Suspense>
                  </div>
                ) : annualHasData ? (
                  <button
                    type="button"
                    onClick={() => setIsAnnualChartVisible(true)}
                    className="w-full flex items-center justify-center h-24 rounded-xl border border-white/30 border-dashed text-slate-200 hover:bg-white/10 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-white"
                  >
                    Carregar gráfico mensal
                  </button>
                ) : (
                  <div className="flex items-center justify-center h-24 rounded-xl border border-white/40 border-dashed">
                    <p className="text-slate-200 text-sm">
                      Marque bilhetes como emitidos e adicione preços para ver o
                      gráfico anual
                    </p>
                  </div>
                )}
              </Card>
            )}
          </div>
        )}

        {!decisionCenterPreferences.isPinned && decisionCenterSection}

        {!weeksQuery.isLoading && (
          <WeeklyPlanning
            year={selectedYear}
            items={weeklyPlanningItems}
            hideValues={hideValues}
            onToggleFavorite={handleToggleWeeklyFavorite}
          />
        )}

        {!weeksQuery.isLoading && (
          <AnnualPlanningProgress
            progress={annualProgress}
            goal={annualEmissionGoal}
            goalProgress={annualGoalProgress}
            year={selectedYear}
            isOpen={expandablePanels.annualProgress}
            onToggle={() => updateExpandablePanel("annualProgress")}
            onShowPending={showPendingWeeks}
            onSaveGoal={handleSaveAnnualGoal}
            comparison={comparisonWithGoals}
            onSaveComparisonGoal={handleSaveComparisonGoal}
            isComparisonLoading={progressComparisonQuery.isLoading}
          />
        )}

        {!weeksQuery.isLoading && (
          <AttentionCenter
            items={activeAttentionItems}
            dismissedItems={dismissedAttentionItems}
            dismissals={attentionDismissals}
            hideValues={hideValues}
            isOpen={expandablePanels.attentionCenter}
            onToggle={() => updateExpandablePanel("attentionCenter")}
            onOpenWeek={openAttentionWeek}
            onDismiss={handleDismissAttention}
            onRestore={handleRestoreAttention}
          />
        )}
          </ContentReveal>
          )
        )}

        {isManagementView && (
          <section className="management-navy-theme mb-6 rounded-3xl border border-blue-100 bg-gradient-to-br from-blue-50 via-white to-indigo-50 p-5 shadow-sm dark:border-slate-800 dark:from-slate-900 dark:via-slate-950 dark:to-indigo-950/30 sm:mb-8 sm:p-7">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.14em] text-blue-600 dark:text-blue-300">Área operacional dedicada</p>
                <h2 className="mt-1 text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100 sm:text-3xl">Gestão de Passagens</h2>
                <p className="mt-2 max-w-2xl text-sm text-slate-600 dark:text-slate-300">Planeje o exercício, filtre semanas, registre bilhetes e acompanhe todos os meses em um único fluxo.</p>
              </div>
              <Link href="/" className="inline-flex min-h-10 items-center justify-center rounded-xl border border-blue-200 bg-white px-3 py-2 text-sm font-semibold text-blue-700 shadow-sm transition-colors hover:bg-blue-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 dark:border-blue-800 dark:bg-slate-900 dark:text-blue-300">
                Voltar para a visão geral
              </Link>
            </div>
          </section>
        )}

        {isManagementView && (
          <div className="management-navy-theme">
        {/* Filtros com Accordion */}
        {weeksQuery.isLoading ? (
          <SkeletonFilters />
        ) : (
          <div className="mb-4 animate-in fade-in duration-500 motion-reduce:animate-none sm:mb-8">
            <button
              onClick={() => {
                setExpandFilters(!expandFilters);
                markDashboardLayoutAsCustom();
              }}
              className="w-full flex items-center justify-between px-4 sm:px-6 py-3 sm:py-4 bg-gradient-to-r from-slate-900 via-blue-950 to-slate-900 text-white rounded-3xl hover:from-slate-800 hover:via-blue-900 hover:to-slate-800 transition-colors shadow-lg focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
              aria-label="Expandir/Recolher Filtros e Controles"
              aria-expanded={expandFilters}
              aria-controls="filters-content"
            >
              <span className="flex items-center gap-2 text-lg font-bold">
                Filtros e Controles
                {activeManagementFilterCount > 0 && (
                  <span
                    className="rounded-full bg-white/15 px-2 py-0.5 text-xs font-bold text-white ring-1 ring-white/30"
                    aria-label={`${activeManagementFilterCount} ${activeManagementFilterCount === 1 ? "filtro ativo" : "filtros ativos"}`}
                  >
                    {activeManagementFilterCount}
                  </span>
                )}
              </span>
              {expandFilters ? (
                <ChevronUp className="w-5 h-5" />
              ) : (
                <ChevronDown className="w-5 h-5" />
              )}
            </button>
            {expandFilters && (
              <button
                type="button"
                tabIndex={-1}
                aria-label="Fechar painel de filtros"
                onClick={() => setExpandFilters(false)}
                className="fixed inset-0 z-40 bg-slate-950/55 sm:hidden"
              />
            )}
            {expandFilters && (
              <Card
                id="filters-content"
                className={`z-50 mb-4 overflow-hidden rounded-b-3xl rounded-t-none border p-4 shadow-xl backdrop-blur-md transition-colors duration-300 sm:mb-8 sm:p-6 max-sm:fixed max-sm:inset-x-0 max-sm:bottom-0 max-sm:max-h-[86dvh] max-sm:overflow-y-auto max-sm:rounded-b-none max-sm:rounded-t-[2rem] max-sm:border-[#315c99] ${
                  theme === "dark"
                    ? "bg-slate-800/80 border-slate-700/30"
                    : "bg-white/80 border-white/20"
                }`}
              >
                <div className="mb-4 flex items-center justify-between border-b border-[#c8d6e9] pb-3 sm:hidden">
                  <div className="flex items-center gap-2 text-[#071a36] dark:text-white">
                    <SlidersHorizontal className="size-4" aria-hidden="true" />
                    <span className="font-bold">Filtros de passagens</span>
                  </div>
                  <Button type="button" variant="ghost" size="sm" onClick={() => setExpandFilters(false)} aria-label="Fechar filtros">Fechar</Button>
                </div>
                {/* Linha 1: Mês, Companhia, Ordenar por, Filtro de Preço, Status do Bilhete */}
                <div className="grid min-w-0 grid-cols-1 min-[480px]:grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 sm:gap-4 [&>div]:min-w-0">
                  <div>
                    <label
                      className={`text-sm font-semibold mb-2 block transition-colors duration-300 ${
                        theme === "dark" ? "text-slate-300" : "text-slate-700"
                      }`}
                    >
                      Mês
                    </label>
                    <Select value={filterMonth} onValueChange={setFilterMonth}>
                      <SelectTrigger aria-label="Filtrar por Mês">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">Todos os meses</SelectItem>
                        {[
                          "01",
                          "02",
                          "03",
                          "04",
                          "05",
                          "06",
                          "07",
                          "08",
                          "09",
                          "10",
                          "11",
                          "12",
                        ].map((m, i) => (
                          <SelectItem key={m} value={m}>
                            {
                              [
                                "Janeiro",
                                "Fevereiro",
                                "Março",
                                "Abril",
                                "Maio",
                                "Junho",
                                "Julho",
                                "Agosto",
                                "Setembro",
                                "Outubro",
                                "Novembro",
                                "Dezembro",
                              ][i]
                            }
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <label
                      className={`text-sm font-semibold mb-2 block transition-colors duration-300 ${
                        theme === "dark" ? "text-slate-300" : "text-slate-700"
                      }`}
                    >
                      Companhia
                    </label>
                    <Select
                      value={filterAirline}
                      onValueChange={setFilterAirline}
                    >
                      <SelectTrigger aria-label="Filtrar por Companhia Aérea">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">Todas as companhias</SelectItem>
                        {airlines.map(a => (
                          <SelectItem key={a.id} value={a.id}>
                            <div className="flex items-center gap-2">
                              <span className="text-lg">{a.icon}</span>
                              <span>{a.name}</span>
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <label
                      className={`text-sm font-semibold mb-2 block transition-colors duration-300 ${
                        theme === "dark" ? "text-slate-300" : "text-slate-700"
                      }`}
                    >
                      Ordenar por
                    </label>
                    <Select value={sortBy} onValueChange={setSortBy}>
                      <SelectTrigger aria-label="Ordenar Resultados">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="week">Semana</SelectItem>
                        <SelectItem value="price">Preço</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <label
                      className={`text-sm font-semibold mb-2 block transition-colors duration-300 ${
                        theme === "dark" ? "text-slate-300" : "text-slate-700"
                      }`}
                    >
                      Filtro de Preço
                    </label>
                    <div className="flex items-center gap-2 mt-1">
                      <Checkbox
                        id="cheap-filter"
                        checked={showCheapestOnly}
                        onCheckedChange={c => setShowCheapestOnly(c as boolean)}
                      />
                      <label
                        htmlFor="cheap-filter"
                        className={`text-sm cursor-pointer select-none transition-colors duration-300 ${
                          theme === "dark" ? "text-slate-400" : "text-slate-600"
                        }`}
                      >
                        Apenas os mais baratos
                      </label>
                    </div>
                  </div>

                  <div>
                    <label
                      className={`text-sm font-semibold mb-2 block transition-colors duration-300 ${
                        theme === "dark" ? "text-slate-300" : "text-slate-700"
                      }`}
                    >
                      Status do Bilhete
                    </label>
                    <Select
                      value={filterTicketStatus}
                      onValueChange={setFilterTicketStatus}
                    >
                      <SelectTrigger aria-label="Filtrar por Status do Bilhete">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">Todos</SelectItem>
                        <SelectItem value="issued">Emitidos</SelectItem>
                        <SelectItem value="notIssued">Não Emitidos</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {/* Linha 2: Horários de Ida e Volta + Botão Limpar + Resumo */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mt-4">
                  <div>
                    <div className="flex justify-between items-center mb-2">
                      <label
                        htmlFor="departureTimeFilter"
                        className="text-sm font-semibold text-slate-700 dark:text-slate-300 cursor-pointer"
                      >
                        Horário de Ida: {minutesToTime(departureTimeFilter)}
                      </label>
                      <span className="text-xs bg-blue-100 dark:bg-blue-900 text-blue-900 dark:text-blue-100 px-2 py-1 rounded">
                        {(() => {
                          let count = 0;
                          for (let i = 0; i < filteredWeeks.length; i++) {
                            const depMin = getFlightMinutes(
                              filteredWeeks[i].departureFlightDatetime
                            );
                            if (
                              depMin >= 0 &&
                              depMin >= departureTimeFilter &&
                              depMin <= 1439
                            ) {
                              count++;
                            }
                          }
                          return count;
                        })()}{" "}
                        voos
                      </span>
                    </div>
                    <input
                      id="departureTimeFilter"
                      type="range"
                      min="0"
                      max="1439"
                      step="15"
                      value={departureTimeFilter}
                      onChange={e =>
                        setDepartureTimeFilter(parseInt(e.target.value))
                      }
                      className="w-full"
                      aria-label="Filtro de Horário de Ida"
                    />
                  </div>

                  <div>
                    <div className="flex justify-between items-center mb-2">
                      <label
                        htmlFor="returnTimeFilter"
                        className="text-sm font-semibold text-slate-700 dark:text-slate-300 cursor-pointer"
                      >
                        Horário de Volta: {minutesToTime(returnTimeFilter)}
                      </label>
                      <span className="text-xs bg-blue-100 dark:bg-blue-900 text-blue-900 dark:text-blue-100 px-2 py-1 rounded">
                        {(() => {
                          let count = 0;
                          for (let i = 0; i < filteredWeeks.length; i++) {
                            const retMin = getFlightMinutes(
                              filteredWeeks[i].returnFlightDatetime
                            );
                            if (
                              retMin >= 0 &&
                              retMin >= returnTimeFilter &&
                              retMin <= 1439
                            ) {
                              count++;
                            }
                          }
                          return count;
                        })()}{" "}
                        voos
                      </span>
                    </div>
                    <input
                      id="returnTimeFilter"
                      type="range"
                      min="0"
                      max="1439"
                      step="15"
                      value={returnTimeFilter}
                      onChange={e =>
                        setReturnTimeFilter(parseInt(e.target.value))
                      }
                      className="w-full"
                      aria-label="Filtro de Horário de Volta"
                    />
                  </div>

                  <div className="flex items-end">
                    <Button
                      onClick={() => {
                        setDepartureTimeFilter(0);
                        setReturnTimeFilter(0);
                      }}
                      variant="outline"
                      size="sm"
                      className="w-full text-slate-700 dark:text-slate-300"
                      disabled={
                        departureTimeFilter === 0 && returnTimeFilter === 0
                      }
                    >
                      <RotateCcw className="w-4 h-4 mr-2" />
                      Limpar Horários
                    </Button>
                  </div>

                  <div className="bg-green-50 border border-green-200 rounded-lg p-4 flex flex-col justify-center">
                    <p className="text-sm font-semibold text-green-900">
                      {sortedWeeks.length} viagens
                    </p>
                    <p className="text-xs text-green-700">
                      {44 - deletedWeeks.length} semanas disponíveis
                    </p>
                    {showCheapestOnly && priceThreshold && (
                      <p className="text-xs text-green-700 mt-1">
                        Limite:{" "}
                        {hideValues
                          ? "••••"
                          : `R$ ${priceThreshold.toFixed(2)}`}
                      </p>
                    )}
                  </div>
                </div>

                {showCheapestOnly && (
                  <div className="mt-6 pt-6 border-t border-slate-200">
                    <label
                      htmlFor="pricePercentile"
                      className="text-sm font-semibold text-slate-700 mb-3 block cursor-pointer"
                    >
                      Percentil de Preço: {pricePercentile}%
                    </label>
                    <input
                      id="pricePercentile"
                      type="range"
                      min="5"
                      max="50"
                      step="5"
                      value={pricePercentile}
                      onChange={e =>
                        setPricePercentile(parseInt(e.target.value))
                      }
                      className="w-full"
                      aria-label="Filtro de Percentil de Preço"
                    />
                    <p className="text-xs text-slate-500 mt-2">
                      Ajuste para mostrar voos mais ou menos baratos
                    </p>
                  </div>
                )}
              </Card>
            )}
          </div>
        )}

        {/* Avisos de filtros ativos */}
        {(showCheapestOnly || filterTicketStatus !== "all") && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6 flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-semibold text-blue-900">
                Filtros Ativos
              </p>
              <p className="text-sm text-blue-700 mt-1">
                {showCheapestOnly &&
                  `Mostrando ${pricePercentile}% mais baratos`}
                {showCheapestOnly && filterTicketStatus !== "all" && " • "}
                {filterTicketStatus === "issued" && "Apenas bilhetes emitidos"}
                {filterTicketStatus === "notIssued" &&
                  "Apenas bilhetes não emitidos"}
              </p>
            </div>
          </div>
        )}

        {/* Loading */}
        {isLoading && (
          <div className="flex items-center justify-center py-16">
            <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
            <span className="ml-3 text-slate-600">Carregando dados...</span>
          </div>
        )}

        {/* Gestão de Passagens: lista de semanas agrupada por mês */}
        {!isLoading && (
          <PassageManagementFrame
            allMonthsExpanded={allMonthsExpanded}
            onToggleAll={toggleAllMonths}
          >
        {weeksData.length > 0 && (
          <div className="mb-3 flex animate-in fade-in duration-500 motion-reduce:animate-none justify-end">
            <Button
              variant="outline"
              size="sm"
              onClick={toggleAllWeeks}
              className="gap-2 text-xs sm:text-sm"
            >
              {expandedWeekCards.size === weeksData.length ? (
                <>
                  <ChevronUp className="w-4 h-4" />
                  Recolher Tudo
                </>
              ) : (
                <>
                  <ChevronDown className="w-4 h-4" />
                  Expandir Tudo
                </>
              )}
            </Button>
          </div>
        )}
          <div className="animate-in fade-in duration-500 motion-reduce:animate-none space-y-3">
            {sortedWeeks.length === 0 ? (
              <Card className="p-6 sm:p-12 text-center border-0 shadow-md bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800">
                <div className="flex w-full max-w-full flex-col items-center">
                  <Calendar className="w-16 h-16 text-slate-300 dark:text-slate-600 mb-4" />
                  <h3 className="max-w-full break-words text-xl font-semibold text-slate-700 dark:text-slate-300 mb-2">
                    {weeksData.length === 0
                      ? `Planejamento de ${selectedYear} ainda não disponível`
                      : "Nenhum voo encontrado"}
                  </h3>
                  <p className="w-full max-w-md text-slate-600 dark:text-slate-400 mb-6">
                    {weeksData.length === 0
                      ? isAuthenticated
                        ? "As semanas serão criadas automaticamente para este exercício. Se a criação não concluir, tente gerar novamente."
                        : "Entre para criar e administrar as semanas deste exercício sem misturar dados de outros anos."
                      : "Desculpe, não encontramos voos que correspondam aos seus filtros. Tente ajustar os horários, mês ou outras opções de filtro."}
                  </p>
                  <div className="flex w-full max-w-full gap-3 justify-center flex-wrap">
                    {weeksData.length === 0 ? (
                      <Button
                        variant="outline"
                        className="min-w-0 max-w-full whitespace-normal border-slate-300 text-slate-700 dark:border-slate-600 dark:text-slate-300"
                        disabled={ensureYearWeeksMutation.isPending}
                        onClick={() => {
                          if (!isAuthenticated) {
                            setShowLoginModal(true);
                            return;
                          }
                          ensureYearWeeksMutation.mutate(
                            { year: selectedYear },
                            {
                              onSuccess: () =>
                                utils.flights.getWeeks.invalidate({
                                  year: selectedYear,
                                }),
                            }
                          );
                        }}
                      >
                        <Calendar className="w-4 h-4 mr-2" />
                        {isAuthenticated
                          ? `Gerar semanas de ${selectedYear}`
                          : "Entrar para criar planejamento"}
                      </Button>
                    ) : (
                      <Button
                        variant="outline"
                        className="min-w-0 max-w-full whitespace-normal border-slate-300 text-slate-700 dark:border-slate-600 dark:text-slate-300"
                        onClick={() => {
                          setFilterMonth("all");
                          setFilterAirline("all");
                          setFilterTicketStatus("all");
                          setShowCheapestOnly(false);
                          setDepartureTimeFilter(0);
                          setReturnTimeFilter(0);
                        }}
                      >
                        <RotateCcw className="w-4 h-4 mr-2" />
                        Limpar Todos os Filtros
                      </Button>
                    )}
                  </div>
                </div>
              </Card>
            ) : (
              weeksByMonth.map(
                ({
                  monthKey,
                  monthLabel,
                  weeks: monthWeeks,
                  monthIssued,
                  monthSelected,
                  monthHasHoliday,
                  monthIssuedTotal,
                  monthSmilesTotal,
                  monthLatamPassTotal,
                }) => {
                  const isOpen = expandedMonths.has(monthKey);
                  return (
                    <div
                      key={monthKey}
                      className="rounded-xl overflow-hidden bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border border-white/20 dark:border-slate-700/30 rounded-2xl shadow-xl"
                    >
                      {/* Cabeçalho do Mês */}
                      <button
                        onClick={() => toggleMonth(monthKey)}
                        className={`w-full flex items-center justify-between px-3 sm:px-6 py-3 sm:py-4 transition-colors duration-200 motion-reduce:transition-none focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-inset rounded-t-xl ${
                          isOpen
                            ? "bg-blue-600 text-white dark:bg-blue-700"
                            : "bg-white hover:bg-slate-50 text-slate-900 dark:bg-slate-800 dark:hover:bg-slate-700 dark:text-slate-100"
                        }`}
                        aria-expanded={isOpen}
                        aria-controls={`month-content-${monthKey}`}
                        aria-label={
                          isOpen
                            ? `Recolher mês ${monthLabel} ${selectedYear}`
                            : `Expandir mês ${monthLabel} ${selectedYear}`
                        }
                      >
                        <div className="flex items-center gap-3">
                          <ChevronDown
                            className={`w-5 h-5 transition-transform duration-300 ease-out motion-reduce:transition-none ${
                              isOpen
                                ? "rotate-180 text-white"
                                : "text-slate-500 dark:text-slate-400"
                            }`}
                          />
                          <span className="text-sm sm:text-lg font-bold">
                            {monthLabel} {selectedYear}
                          </span>
                          {monthHasHoliday && (
                            <span
                              className={`text-xs px-2 py-0.5 rounded-full font-semibold ${
                                isOpen
                                  ? "bg-white/20 text-white"
                                  : "bg-orange-100 text-orange-700 dark:bg-orange-900/40 dark:text-orange-200"
                              }`}
                            >
                              🎉 Feriado
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-1 sm:gap-4 text-xs sm:text-sm flex-wrap justify-end">
                          <span
                            className={
                              isOpen
                                ? "text-blue-100"
                                : "text-slate-500 dark:text-slate-400"
                            }
                          >
                            {monthWeeks.length} semana
                            {monthWeeks.length !== 1 ? "s" : ""}
                          </span>
                          {monthSelected > 0 && (
                            <span
                              className={`px-2 py-0.5 rounded-full text-xs font-semibold ${
                                isOpen
                                  ? "bg-white/20 text-white"
                                  : "bg-green-100 text-green-700"
                              }`}
                            >
                              ✓ {monthSelected} selecionada
                              {monthSelected !== 1 ? "s" : ""}
                            </span>
                          )}
                          {monthIssued > 0 && (
                            <span
                              className={`px-2 py-0.5 rounded-full text-xs font-semibold ${
                                isOpen
                                  ? "bg-white/20 text-white"
                                  : "bg-blue-100 text-blue-700"
                              }`}
                            >
                              ✓ {monthIssued} emitido
                              {monthIssued !== 1 ? "s" : ""}
                            </span>
                          )}
                          {monthIssuedTotal > 0 && (
                            <span
                              className={`px-2 py-0.5 rounded-full text-xs font-bold ${
                                isOpen
                                  ? "bg-white/30 text-white"
                                  : "bg-emerald-100 text-emerald-700"
                              }`}
                            >
                              {hideValues
                                ? "••••"
                                : `R$ ${monthIssuedTotal.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
                            </span>
                          )}
                          {monthSmilesTotal > 0 && (
                            <span
                              className={`px-2 py-0.5 rounded-full text-xs font-bold badge-glow-smiles ${
                                isOpen
                                  ? "bg-orange-400/80 text-white"
                                  : "bg-orange-100 text-orange-700"
                              }`}
                              title="Total de pontos SMILES gastos no mês"
                            >
                              {hideValues
                                ? "••••"
                                : `✦ ${monthSmilesTotal.toLocaleString("pt-BR")} pts`}
                            </span>
                          )}
                          {monthLatamPassTotal > 0 && (
                            <span
                              className={`px-2 py-0.5 rounded-full text-xs font-bold badge-glow-latam ${
                                isOpen
                                  ? "bg-red-400/80 text-white"
                                  : "bg-red-100 text-red-700"
                              }`}
                              title="Total de pontos LATAM PASS gastos no mês"
                            >
                              {hideValues
                                ? "••••"
                                : `✦ ${monthLatamPassTotal.toLocaleString("pt-BR")} LATAM`}
                            </span>
                          )}
                        </div>
                      </button>

                      {/* Semanas do Mês */}
                      <div
                        id={`month-content-${monthKey}`}
                        aria-hidden={!isOpen}
                        inert={!isOpen}
                        className={`grid overflow-hidden transition-[grid-template-rows,opacity] duration-300 ease-out motion-reduce:transition-none ${
                          isOpen
                            ? "grid-rows-[1fr] opacity-100"
                            : "grid-rows-[0fr] opacity-0 pointer-events-none"
                        }`}
                      >
                        <div className="min-h-0 overflow-hidden">
                          <div className="divide-y divide-slate-100 dark:divide-slate-700">
                          {monthWeeks.map((week, weekIndex) => {
                            const lowestPrice = getLowestPrice(week.weekNumber);
                            const isCheap =
                              showCheapestOnly &&
                              priceThreshold &&
                              lowestPrice &&
                              lowestPrice <= priceThreshold;

                            const {
                              feriados,
                              feriadoIda,
                              feriadoRetorno,
                              feriadosIntervaloCopa,
                              feriadosIntervaloNaoCopa,
                              jogosDosBrasil,
                              fasesEliminatorias,
                            } = feriadosByWeek[week.weekNumber] || {
                              feriados: [],
                              feriadoIda: [],
                              feriadoRetorno: [],
                              feriadosIntervaloCopa: [],
                              feriadosIntervaloNaoCopa: [],
                              jogosDosBrasil: [],
                              fasesEliminatorias: [],
                            };

                            return (
                              <Card
                                key={week.weekNumber}
                                id={`week-card-${week.weekNumber}`}
                                className={`p-3 sm:p-6 border-0 shadow-md transition-all hover:shadow-lg dark:bg-slate-800 dark:shadow-slate-900/40 rounded-lg relative ${
                                  isOpen
                                    ? "animate-in fade-in slide-in-from-bottom-2 duration-300 motion-reduce:animate-none"
                                    : ""
                                } ${
                                  week.isSelected
                                    ? "ring-2 ring-green-500 bg-green-50 dark:bg-green-900/30"
                                    : week.isTicketIssued
                                      ? "bg-blue-50 dark:bg-blue-900/30"
                                      : "bg-white dark:bg-slate-800"
                                } ${isCheap ? "border-l-4 border-l-orange-400" : ""} ${
                                  week.weekNumber === currentWeekNumber
                                    ? "ring-2 ring-purple-500 ring-offset-2 dark:ring-offset-slate-900"
                                    : ""
                                }`}
                                style={
                                  isOpen
                                    ? {
                                        animationDelay: `${Math.min(weekIndex, 7) * 45}ms`,
                                        animationFillMode: "both",
                                      }
                                    : undefined
                                }
                              >
                                {/* Cabeçalho da semana - sempre visível, clicável para expandir/recolher */}
                                <div
                                  className="flex items-start justify-between gap-2 sm:gap-4 cursor-pointer select-none focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 rounded-lg"
                                  role="button"
                                  aria-expanded={expandedWeekCards.has(
                                    week.weekNumber
                                  )}
                                  aria-controls={`week-content-${week.weekNumber}`}
                                  tabIndex={0}
                                  onClick={e => {
                                    // Não toggle se clicou em botão, checkbox ou input
                                    const target = e.target as HTMLElement;
                                    if (
                                      target.closest("button") ||
                                      target.closest("input") ||
                                      target.closest('[role="checkbox"]') ||
                                      target.closest("label")
                                    )
                                      return;
                                    toggleWeekCard(week.weekNumber);
                                  }}
                                  onKeyDown={e => {
                                    if (e.key === "Enter" || e.key === " ") {
                                      e.preventDefault();
                                      const target = e.target as HTMLElement;
                                      if (
                                        target.closest("button") ||
                                        target.closest("input") ||
                                        target.closest('[role="checkbox"]') ||
                                        target.closest("label")
                                      )
                                        return;
                                      toggleWeekCard(week.weekNumber);
                                    }
                                  }}
                                >
                                  <div className="flex items-start gap-2 sm:gap-4 flex-1">
                                    <Checkbox
                                      id={`select-week-${week.weekNumber}`}
                                      aria-label={`Selecionar semana ${week.weekNumber}`}
                                      checked={!!week.isSelected}
                                      onCheckedChange={() =>
                                        handleToggleSelect(
                                          week.weekNumber,
                                          week.isSelected
                                        )
                                      }
                                      className="mt-1"
                                    />
                                    <div className="flex-1">
                                      <div className="flex flex-wrap items-center gap-2 mb-2">
                                        <div className="flex items-center gap-2">
                                          <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100">
                                            Semana {week.weekNumber}
                                          </h3>
                                          {week.weekNumber ===
                                            currentWeekNumber && (
                                            <span className="text-xs bg-purple-500 text-white px-2 py-1 rounded-full font-semibold animate-pulse">
                                              🔴 Atual
                                            </span>
                                          )}
                                        </div>
                                        {week.holiday && (
                                          <span className="text-xs bg-orange-100 text-orange-800 dark:bg-orange-900/40 dark:text-orange-200 px-2 py-1 rounded">
                                            🎉 {week.holiday}
                                          </span>
                                        )}
                                        {/* Jogos da Copa do Mundo no intervalo da semana */}
                                        {feriadosIntervaloCopa.map(f => (
                                          <span
                                            key={f.feriado.data + f.tipo}
                                            className="text-xs bg-green-100 text-green-800 dark:bg-green-900/40 dark:text-green-200 px-2 py-1 rounded font-semibold"
                                          >
                                            {f.feriado.nome}
                                          </span>
                                        ))}
                                        {getTotalWeekCost(week.weekNumber) && (
                                          <span className="text-xs bg-green-100 text-green-800 dark:bg-green-900/40 dark:text-green-200 px-2 py-1 rounded font-semibold">
                                            💰{" "}
                                            {hideValues
                                              ? "\u2022\u2022\u2022\u2022"
                                              : `R$ ${getTotalWeekCost(week.weekNumber)!.toFixed(2)}`}
                                          </span>
                                        )}
                                        {week.smilesPoints ? (
                                          <span className="text-xs bg-orange-100 text-orange-800 dark:bg-orange-900/40 dark:text-orange-200 px-2 py-1 rounded font-semibold">
                                            ✦{" "}
                                            {hideValues
                                              ? "••••"
                                              : `${week.smilesPoints.toLocaleString("pt-BR")} pts`}
                                          </span>
                                        ) : null}
                                        {week.latamPassPoints ? (
                                          <span className="text-xs bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-200 px-2 py-1 rounded font-semibold">
                                            ✦{" "}
                                            {hideValues
                                              ? "••••"
                                              : `${week.latamPassPoints.toLocaleString("pt-BR")} LATAM`}
                                          </span>
                                        ) : null}
                                        {week.isTicketIssued ? (
                                          <span className="text-xs bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-200 px-2 py-1 rounded flex items-center gap-1">
                                            <CheckCircle2 className="w-3 h-3" />{" "}
                                            Bilhete Emitido
                                          </span>
                                        ) : null}
                                        {SHOW_TERMINALS_IN_WEEK_SUMMARY &&
                                        week.isTicketIssued &&
                                        (week.departureTerminal ||
                                          ((week.ticketType ?? "roundtrip") !==
                                            "oneway" &&
                                            week.returnTerminal)) ? (
                                          <span
                                            className="text-xs bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-200 px-2 py-1 rounded flex flex-wrap items-center gap-x-2 gap-y-0.5"
                                            aria-label="Terminais do bilhete"
                                          >
                                            {week.departureTerminal ? (
                                              <span>Terminal ida: {week.departureTerminal}</span>
                                            ) : null}
                                            {(week.ticketType ?? "roundtrip") !==
                                              "oneway" && week.returnTerminal ? (
                                              <span>Terminal volta: {week.returnTerminal}</span>
                                            ) : null}
                                          </span>
                                        ) : null}
                                      </div>
                                      {/* Datas editáveis inline com dia da semana */}
                                      {(() => {
                                        // Converte DD/MM/YYYY → YYYY-MM-DD para o input type=date
                                        const toInputDate = (d: string) => {
                                          if (!d || d.length !== 10) return "";
                                          return `${d.substring(6, 10)}-${d.substring(3, 5)}-${d.substring(0, 2)}`;
                                        };
                                        // Converte YYYY-MM-DD → DD/MM/YYYY para exibição e persistência
                                        const toDisplayDate = (d: string) => {
                                          if (!d || d.length !== 10) return d;
                                          return `${d.substring(8, 10)}/${d.substring(5, 7)}/${d.substring(0, 4)}`;
                                        };
                                        // Calcula dia da semana a partir de YYYY-MM-DD
                                        const getDayLabel = (
                                          isoDate: string
                                        ) => {
                                          if (!isoDate || isoDate.length < 10)
                                            return "";
                                          const y = +isoDate.substring(0, 4);
                                          const m = +isoDate.substring(5, 7);
                                          const d = +isoDate.substring(8, 10);
                                          if (!y || !m || !d) return "";
                                          const date = new Date(y, m - 1, d);
                                          const days = [
                                            "Dom",
                                            "Seg",
                                            "Ter",
                                            "Qua",
                                            "Qui",
                                            "Sex",
                                            "Sáb",
                                          ];
                                          return days[date.getDay()];
                                        };

                                        const handleDateBlur = (
                                          field: "departure" | "return",
                                          isoValue: string
                                        ) => {
                                          if (!isoValue || isoValue.length < 10)
                                            return;
                                          const displayDate =
                                            toDisplayDate(isoValue);
                                          const y = +isoValue.substring(0, 4);
                                          const m = +isoValue.substring(5, 7);
                                          const d = +isoValue.substring(8, 10);
                                          const date = new Date(y, m - 1, d);
                                          const days = [
                                            "Domingo",
                                            "Segunda",
                                            "Terça",
                                            "Quarta",
                                            "Quinta",
                                            "Sexta",
                                            "Sábado",
                                          ];
                                          const dayOfWeek = days[date.getDay()];
                                          const currentDep = toInputDate(
                                            week.departureDate
                                          );
                                          const currentRet = toInputDate(
                                            week.returnDate
                                          );
                                          const newDep =
                                            field === "departure"
                                              ? isoValue
                                              : currentDep;
                                          const newRet =
                                            field === "return"
                                              ? isoValue
                                              : currentRet;
                                          const newDepDisplay =
                                            field === "departure"
                                              ? displayDate
                                              : week.departureDate;
                                          const newRetDisplay =
                                            field === "return"
                                              ? displayDate
                                              : week.returnDate;
                                          const newDepDay =
                                            field === "departure"
                                              ? dayOfWeek
                                              : week.departureDayOfWeek;
                                          const newRetDay =
                                            field === "return"
                                              ? dayOfWeek
                                              : week.returnDayOfWeek;
                                          updateDatesMutation.mutate(
                                            {
                                              year: selectedYear,
                                              weekNumber: week.weekNumber,
                                              departureDate: newDepDisplay,
                                              returnDate: newRetDisplay,
                                              departureDayOfWeek: newDepDay,
                                              returnDayOfWeek: newRetDay,
                                            },
                                            {
                                              onSuccess: () => {
                                                utils.flights.getWeeks.invalidate({
                                                  year: selectedYear,
                                                });
                                                toast.success(
                                                  "Data atualizada!"
                                                );
                                              },
                                              onError: () =>
                                                toast.error(
                                                  "Erro ao salvar data"
                                                ),
                                            }
                                          );
                                        };

                                        const depIso = toInputDate(
                                          week.departureDate
                                        );
                                        const retIso = toInputDate(
                                          week.returnDate
                                        );

                                        return (
                                          <div className="space-y-1.5">
                                            {/* Ida */}
                                            <div className="flex items-center gap-2 flex-wrap">
                                              <Calendar className="w-4 h-4 text-slate-400 flex-shrink-0" />
                                              <label
                                                htmlFor={`ida-date-${week.weekNumber}`}
                                                className="text-sm font-medium text-slate-600 dark:text-slate-300"
                                              >
                                                Ida:
                                              </label>
                                              <input
                                                id={`ida-date-${week.weekNumber}`}
                                                type="date"
                                                defaultValue={depIso}
                                                key={`dep-${week.weekNumber}-${depIso}`}
                                                onBlur={e =>
                                                  handleDateBlur(
                                                    "departure",
                                                    e.target.value
                                                  )
                                                }
                                                className="h-7 text-sm border border-slate-200 dark:border-slate-600 rounded-md px-2 bg-white dark:bg-slate-700 text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-400 dark:focus:ring-blue-500 focus:border-blue-400 dark:focus:border-blue-500"
                                              />
                                              {depIso && (
                                                <span className="text-xs font-semibold text-blue-700 bg-blue-50 border border-blue-200 px-2 py-0.5 rounded-full">
                                                  {getDayLabel(depIso)}
                                                </span>
                                              )}
                                              {feriadoIda.map(f => (
                                                <span
                                                  key={f.feriado.data}
                                                  className={`text-xs px-2 py-0.5 rounded-full font-semibold ${
                                                    f.feriado.tipo === "copa"
                                                      ? "bg-green-100 text-green-800 dark:bg-green-900/40 dark:text-green-200"
                                                      : f.feriado.tipo ===
                                                          "nacional"
                                                        ? "bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-200"
                                                        : "bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-200"
                                                  }`}
                                                >
                                                  {f.feriado.tipo === "copa"
                                                    ? f.feriado.nome
                                                    : `🎉 ${f.feriado.nome}`}
                                                </span>
                                              ))}
                                            </div>
                                            {/* Retorno */}
                                            <div className="flex items-center gap-2 flex-wrap">
                                              <Calendar className="w-4 h-4 text-slate-400 flex-shrink-0" />
                                              <label
                                                htmlFor={`volta-date-${week.weekNumber}`}
                                                className="text-sm font-medium text-slate-600 dark:text-slate-300"
                                              >
                                                Retorno:
                                              </label>
                                              <input
                                                id={`volta-date-${week.weekNumber}`}
                                                type="date"
                                                defaultValue={retIso}
                                                key={`ret-${week.weekNumber}-${retIso}`}
                                                onBlur={e =>
                                                  handleDateBlur(
                                                    "return",
                                                    e.target.value
                                                  )
                                                }
                                                className="h-7 text-sm border border-slate-200 dark:border-slate-600 rounded-md px-2 bg-white dark:bg-slate-700 text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-400 dark:focus:ring-blue-500 focus:border-blue-400 dark:focus:border-blue-500"
                                              />
                                              {retIso && (
                                                <span className="text-xs font-semibold text-green-700 bg-green-50 border border-green-200 px-2 py-0.5 rounded-full">
                                                  {getDayLabel(retIso)}
                                                </span>
                                              )}
                                              {feriadoRetorno.map(f => (
                                                <span
                                                  key={f.feriado.data}
                                                  className={`text-xs px-2 py-0.5 rounded-full font-semibold ${
                                                    f.feriado.tipo === "copa"
                                                      ? "bg-green-100 text-green-800 dark:bg-green-900/40 dark:text-green-200"
                                                      : f.feriado.tipo ===
                                                          "nacional"
                                                        ? "bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-200"
                                                        : "bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-200"
                                                  }`}
                                                >
                                                  {f.feriado.tipo === "copa"
                                                    ? f.feriado.nome
                                                    : `🎉 ${f.feriado.nome}`}
                                                </span>
                                              ))}
                                            </div>
                                            {feriadosIntervaloNaoCopa.length >
                                              0 && (
                                              <p className="text-xs text-slate-500 flex items-center gap-1 flex-wrap pl-5">
                                                <span className="text-orange-600 dark:text-orange-300 font-semibold">
                                                  ⚠️ Feriados no período:
                                                </span>
                                                {feriadosIntervaloNaoCopa.map(
                                                  f => (
                                                    <span
                                                      key={f.feriado.data}
                                                      className={`px-2 py-0.5 rounded-full ${
                                                        f.feriado.tipo ===
                                                        "nacional"
                                                          ? "bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-200"
                                                          : "bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-200"
                                                      }`}
                                                    >
                                                      {f.feriado.data.slice(
                                                        0,
                                                        5
                                                      )}{" "}
                                                      – {f.feriado.nome}
                                                    </span>
                                                  )
                                                )}
                                              </p>
                                            )}
                                            {feriadosIntervaloCopa.length >
                                              0 && (
                                              <p className="text-xs text-slate-500 flex items-center gap-1 flex-wrap pl-5">
                                                <span className="text-green-700 dark:text-green-300 font-semibold">
                                                  ⚽ Copa 2026 no período:
                                                </span>
                                                {feriadosIntervaloCopa.map(
                                                  f => (
                                                    <span
                                                      key={f.feriado.data}
                                                      className="px-2 py-0.5 rounded-full bg-green-100 text-green-800 dark:bg-green-900/40 dark:text-green-200 font-semibold"
                                                    >
                                                      {f.feriado.data.slice(
                                                        0,
                                                        5
                                                      )}{" "}
                                                      – {f.feriado.nome}
                                                    </span>
                                                  )
                                                )}
                                              </p>
                                            )}
                                          </div>
                                        );
                                      })()}
                                    </div>
                                  </div>

                                  <div className="flex items-center gap-2 flex-shrink-0">
                                    {/* Status bilhete + companhias */}
                                    <div className="flex items-center gap-2 flex-wrap">
                                      <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() =>
                                          handleToggleTicket(
                                            week.weekNumber,
                                            week.isTicketIssued
                                          )
                                        }
                                        className={
                                          week.isTicketIssued
                                            ? "bg-blue-100 border-blue-300 text-blue-700"
                                            : ""
                                        }
                                      >
                                        {week.isTicketIssued ? (
                                          <>
                                            <CheckCircle2 className="w-4 h-4 mr-1" />
                                            Emitido
                                          </>
                                        ) : (
                                          <>
                                            <Circle className="w-4 h-4 mr-1" />
                                            Não Emitido
                                          </>
                                        )}
                                      </Button>
                                    </div>
                                    {isAuthenticated && (
                                      <AdditionalFlightHeaderAction
                                        weekNumber={week.weekNumber}
                                        onRequest={requestAdditionalFlight}
                                      />
                                    )}
                                    {/* Excluir */}
                                    <AlertDialog>
                                      <AlertDialogTrigger asChild>
                                        <Button
                                          variant="outline"
                                          size="sm"
                                          className="text-red-600 hover:text-red-700 hover:bg-red-50"
                                          title={`Excluir semana ${week.weekNumber}`}
                                          aria-label={`Excluir semana ${week.weekNumber}`}
                                        >
                                          <Trash2 className="w-4 h-4" />
                                        </Button>
                                      </AlertDialogTrigger>
                                      <AlertDialogContent>
                                        <AlertDialogHeader>
                                          <AlertDialogTitle>
                                            Excluir Semana {week.weekNumber}?
                                          </AlertDialogTitle>
                                          <AlertDialogDescription>
                                            Tem certeza de que deseja excluir os
                                            dados da Semana {week.weekNumber}?
                                            Esta ação pode ser desfeita
                                            posteriormente.
                                          </AlertDialogDescription>
                                        </AlertDialogHeader>
                                        <AlertDialogFooter>
                                          <AlertDialogCancel>
                                            Cancelar
                                          </AlertDialogCancel>
                                          <AlertDialogAction
                                            onClick={() =>
                                              handleDelete(week.weekNumber)
                                            }
                                            className="bg-red-600 text-white hover:bg-red-700 focus:ring-red-600"
                                          >
                                            Excluir
                                          </AlertDialogAction>
                                        </AlertDialogFooter>
                                      </AlertDialogContent>
                                    </AlertDialog>
                                    {/* Expandir/Recolher */}
                                    <Button
                                      variant="ghost"
                                      size="icon"
                                      type="button"
                                      onClick={() =>
                                        toggleWeekCard(week.weekNumber)
                                      }
                                      className="focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 rounded-full p-1 hover:bg-slate-100 transition-colors"
                                      title={
                                        expandedWeekCards.has(week.weekNumber)
                                          ? `Recolher semana ${week.weekNumber}`
                                          : `Expandir semana ${week.weekNumber}`
                                      }
                                      aria-label={
                                        expandedWeekCards.has(week.weekNumber)
                                          ? `Recolher semana ${week.weekNumber}`
                                          : `Expandir semana ${week.weekNumber}`
                                      }
                                      aria-expanded={expandedWeekCards.has(
                                        week.weekNumber
                                      )}
                                      aria-controls={`week-content-${week.weekNumber}`}
                                    >
                                      <ChevronDown
                                        className={`w-5 h-5 text-slate-400 transition-transform duration-200 ${expandedWeekCards.has(week.weekNumber) ? "rotate-180" : ""}`}
                                      />
                                    </Button>
                                  </div>
                                </div>

                                {/* Conteúdo expansível da semana com animação suave */}
                                <div
                                  id={`week-content-${week.weekNumber}`}
                                  className={`overflow-hidden transition-all duration-300 ease-in-out ${
                                    expandedWeekCards.has(week.weekNumber)
                                      ? "max-h-[9999px] opacity-100 mt-3 sm:mt-4"
                                      : "max-h-0 opacity-0 pointer-events-none"
                                  }`}
                                  aria-hidden={
                                    !expandedWeekCards.has(week.weekNumber)
                                  }
                                >
                                  {/* Painel Copa 2026 — apenas semanas com jogos/fases no intervalo */}
                                  {(() => {
                                    // Só renderiza o painel se houver jogos ou fases no intervalo
                                    if (
                                      jogosDosBrasil.length === 0 &&
                                      fasesEliminatorias.length === 0
                                    )
                                      return null;

                                    return (
                                      <div className="mb-4 rounded-xl border border-green-300 bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-950/30 dark:to-emerald-950/30 dark:border-green-700 overflow-hidden">
                                        {/* Cabeçalho */}
                                        <div className="bg-green-700 dark:bg-green-800 px-3 py-2 flex items-center gap-2">
                                          <span className="text-base">⚽</span>
                                          <span className="text-xs font-bold text-white uppercase tracking-wider">
                                            Brasil na Copa do Mundo 2026
                                          </span>
                                        </div>

                                        {/* 1ª Fase — só se houver jogos no intervalo */}
                                        {jogosDosBrasil.length > 0 && (
                                          <div className="px-3 pt-3 pb-1">
                                            <div className="flex items-center gap-1.5 mb-2">
                                              <span className="text-xs font-bold text-green-800 dark:text-green-300 uppercase tracking-wide">
                                                🇧🇷 1ª Fase — Grupo C
                                              </span>
                                            </div>
                                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                                              {jogosDosBrasil.map(jogo => {
                                                const {
                                                  passou,
                                                  ehHoje,
                                                  label,
                                                  mm,
                                                  dd,
                                                  diaSemana,
                                                } = calcDias(jogo.data, hojeMs);
                                                return (
                                                  <div
                                                    key={jogo.data}
                                                    className={`rounded-lg p-3 border flex flex-col gap-1 ${
                                                      passou
                                                        ? "bg-slate-100 border-slate-200 dark:bg-slate-800/40 dark:border-slate-700 opacity-60"
                                                        : ehHoje
                                                          ? "bg-yellow-50 border-yellow-400 dark:bg-yellow-900/30 dark:border-yellow-500 ring-2 ring-yellow-400"
                                                          : "bg-white border-green-200 dark:bg-green-950/20 dark:border-green-700"
                                                    }`}
                                                  >
                                                    <div className="flex items-center gap-1.5">
                                                      <span className="text-lg">
                                                        🇧🇷
                                                      </span>
                                                      <span className="text-xs font-bold text-slate-700 dark:text-slate-200">
                                                        Brasil
                                                      </span>
                                                      <span className="text-xs text-slate-400">
                                                        vs
                                                      </span>
                                                      <span className="text-lg">
                                                        {jogo.bandeira}
                                                      </span>
                                                      <span className="text-xs font-bold text-slate-700 dark:text-slate-200">
                                                        {jogo.adversario}
                                                      </span>
                                                    </div>
                                                    <div className="flex items-center gap-1 text-xs text-slate-500 dark:text-slate-400">
                                                      <Calendar className="w-3 h-3" />
                                                      <span>
                                                        {diaSemana}, {dd}/{mm}
                                                        /2026
                                                      </span>
                                                    </div>
                                                    <div className="flex items-center gap-1 text-xs font-semibold text-slate-700 dark:text-slate-300">
                                                      <Clock className="w-3 h-3" />
                                                      <span>
                                                        {jogo.horario}{" "}
                                                        (Brasília)
                                                      </span>
                                                    </div>
                                                    <div className="flex items-center gap-1 text-xs text-slate-500 dark:text-slate-400">
                                                      <MapPin className="w-3 h-3" />
                                                      <span>{jogo.cidade}</span>
                                                    </div>
                                                    <div
                                                      className={`text-xs font-semibold mt-0.5 ${
                                                        passou
                                                          ? "text-slate-400"
                                                          : ehHoje
                                                            ? "text-yellow-600 dark:text-yellow-400"
                                                            : "text-green-700 dark:text-green-400"
                                                      }`}
                                                    >
                                                      {label}
                                                    </div>
                                                  </div>
                                                );
                                              })}
                                            </div>
                                          </div>
                                        )}

                                        {/* Divisor — só se houver ambas as seções */}
                                        {jogosDosBrasil.length > 0 &&
                                          fasesEliminatorias.length > 0 && (
                                            <div className="mx-3 my-2 border-t border-green-200 dark:border-green-800" />
                                          )}

                                        {/* Fases Eliminatórias — só se houver fases no intervalo */}
                                        {fasesEliminatorias.length > 0 && (
                                          <div className="px-3 pb-3">
                                            <div className="flex items-center gap-1.5 mb-2">
                                              <span className="text-xs font-bold text-green-800 dark:text-green-300 uppercase tracking-wide">
                                                🏆 Fases Eliminatórias —
                                                Possível participação do Brasil
                                              </span>
                                            </div>
                                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-2">
                                              {fasesEliminatorias.map(fase => {
                                                const inicio = calcDias(
                                                  fase.inicio,
                                                  hojeMs
                                                );
                                                const fim = calcDias(
                                                  fase.fim,
                                                  hojeMs
                                                );
                                                // A fase já passou se o fim já passou
                                                const passou = fim.passou;
                                                // A fase está acontecendo agora se inicio passou mas fim não
                                                const emAndamento =
                                                  inicio.passou && !fim.passou;
                                                const mmI =
                                                  fase.inicio.substring(5, 7);
                                                const ddI =
                                                  fase.inicio.substring(8, 10);
                                                const mmF = fase.fim.substring(
                                                  5,
                                                  7
                                                );
                                                const ddF = fase.fim.substring(
                                                  8,
                                                  10
                                                );
                                                const mesmoMes = mmI === mmF;
                                                const periodoLabel = mesmoMes
                                                  ? `${ddI} a ${ddF}/${mmI}`
                                                  : `${ddI}/${mmI} a ${ddF}/${mmF}`;
                                                const diasLabel = passou
                                                  ? "Já realizado"
                                                  : emAndamento
                                                    ? "🔴 Em andamento!"
                                                    : `em ${inicio.diffDias} dia${inicio.diffDias === 1 ? "" : "s"}`;
                                                const colorMap: Record<
                                                  string,
                                                  string
                                                > = {
                                                  blue: "bg-blue-50 border-blue-200 dark:bg-blue-950/20 dark:border-blue-700",
                                                  orange:
                                                    "bg-orange-50 border-orange-200 dark:bg-orange-950/20 dark:border-orange-700",
                                                  purple:
                                                    "bg-purple-50 border-purple-200 dark:bg-purple-950/20 dark:border-purple-700",
                                                  yellow:
                                                    "bg-yellow-50 border-yellow-300 dark:bg-yellow-950/20 dark:border-yellow-600",
                                                };
                                                const labelColorMap: Record<
                                                  string,
                                                  string
                                                > = {
                                                  blue: "text-blue-700 dark:text-blue-400",
                                                  orange:
                                                    "text-orange-700 dark:text-orange-400",
                                                  purple:
                                                    "text-purple-700 dark:text-purple-400",
                                                  yellow:
                                                    "text-yellow-700 dark:text-yellow-400",
                                                };
                                                return (
                                                  <div
                                                    key={fase.fase}
                                                    className={`rounded-lg p-3 border flex flex-col gap-1 ${
                                                      passou
                                                        ? "bg-slate-100 border-slate-200 dark:bg-slate-800/40 dark:border-slate-700 opacity-60"
                                                        : emAndamento
                                                          ? "bg-yellow-50 border-yellow-400 dark:bg-yellow-900/30 dark:border-yellow-500 ring-2 ring-yellow-400"
                                                          : (colorMap[
                                                              fase.cor
                                                            ] ?? colorMap.blue)
                                                    }`}
                                                  >
                                                    <div className="flex items-center gap-1.5">
                                                      <span className="text-base">
                                                        {fase.icone}
                                                      </span>
                                                      <span className="text-xs font-bold text-slate-700 dark:text-slate-200">
                                                        {fase.fase}
                                                      </span>
                                                    </div>
                                                    <div className="flex items-center gap-1 text-xs text-slate-500 dark:text-slate-400">
                                                      <Calendar className="w-3 h-3" />
                                                      <span>
                                                        {periodoLabel}/2026
                                                      </span>
                                                    </div>
                                                    <div className="flex items-center gap-1 text-xs text-slate-500 dark:text-slate-400">
                                                      <MapPin className="w-3 h-3" />
                                                      <span>
                                                        {fase.cidades}
                                                      </span>
                                                    </div>
                                                    <div
                                                      className={`text-xs font-semibold mt-0.5 ${
                                                        passou
                                                          ? "text-slate-400"
                                                          : emAndamento
                                                            ? "text-yellow-600 dark:text-yellow-400"
                                                            : (labelColorMap[
                                                                fase.cor
                                                              ] ??
                                                              labelColorMap.blue)
                                                      }`}
                                                    >
                                                      {diasLabel}
                                                    </div>
                                                    {!passou && (
                                                      <span className="text-xs text-slate-400 dark:text-slate-500 italic">
                                                        possível
                                                      </span>
                                                    )}
                                                  </div>
                                                );
                                              })}
                                            </div>
                                          </div>
                                        )}
                                      </div>
                                    );
                                  })()}
                                  {/* Buscadores de preços + Cards Ida/Volta lado a lado */}
                                  <div className="flex flex-col lg:flex-row gap-3 sm:gap-4 mt-2">
                                    {/* Coluna esquerda: Buscadores de preços */}
                                    <div className="lg:w-72 xl:w-80 flex-shrink-0">
                                      <div
                                        className={`rounded-xl border overflow-hidden transition-colors duration-300 ${
                                          theme === "dark"
                                            ? "border-slate-600 bg-slate-800"
                                            : "border-slate-200 bg-slate-50"
                                        }`}
                                      >
                                        <div
                                          className={`px-3 py-2 flex items-center gap-2 transition-colors duration-300 ${
                                            theme === "dark"
                                              ? "bg-slate-700"
                                              : "bg-slate-700"
                                          }`}
                                        >
                                          <Plane className="w-3.5 h-3.5 text-white" />
                                          <span className="text-xs font-bold text-white uppercase tracking-wider">
                                            Consulta de Preços
                                          </span>
                                        </div>
                                        <div className="p-3 space-y-2">
                                          {/* Campos de Milhas: SMILES e LATAM PASS */}
                                          {(() => {
                                            const currentSmiles =
                                              week.smilesPoints ?? null;
                                            const currentLatam =
                                              week.latamPassPoints ?? null;
                                            const isSavingSmiles =
                                              savingMiles?.week ===
                                                week.weekNumber &&
                                              savingMiles?.field ===
                                                "smilesPoints";
                                            const isSavingLatam =
                                              savingMiles?.week ===
                                                week.weekNumber &&
                                              savingMiles?.field ===
                                                "latamPassPoints";
                                            return (
                                              <>
                                                {/* Separador */}
                                                <div
                                                  className={`border-t pt-2 mt-1 transition-colors duration-300 ${
                                                    theme === "dark"
                                                      ? "border-slate-600"
                                                      : "border-slate-200"
                                                  }`}
                                                >
                                                  <span
                                                    className={`text-[10px] font-semibold uppercase tracking-wider transition-colors duration-300 ${
                                                      theme === "dark"
                                                        ? "text-slate-400"
                                                        : "text-slate-500"
                                                    }`}
                                                  >
                                                    Pagamento em Milhas
                                                  </span>
                                                </div>
                                                {/* SMILES */}
                                                <div className="flex items-center gap-2">
                                                  <span className="bg-orange-500 text-white px-2 py-1 rounded text-xs font-semibold w-20 text-center flex-shrink-0">
                                                    ✦ SMILES
                                                  </span>
                                                  <div className="relative flex-1">
                                                    <label
                                                      htmlFor={`smiles-${week.weekNumber}`}
                                                      className="sr-only"
                                                    >
                                                      Pontos SMILES
                                                    </label>
                                                    {hideValues ? (
                                                      <div className="h-8 rounded-md border border-input bg-muted flex items-center px-3 text-xs text-muted-foreground tracking-widest">
                                                        ••••
                                                      </div>
                                                    ) : (
                                                      <Input
                                                        id={`smiles-${week.weekNumber}`}
                                                        type="number"
                                                        placeholder="0 pts"
                                                        aria-label="Pontos SMILES"
                                                        defaultValue={
                                                          currentSmiles ?? ""
                                                        }
                                                        key={`${week.weekNumber}-smiles-${currentSmiles}`}
                                                        onBlur={e =>
                                                          handleMilesBlur(
                                                            week.weekNumber,
                                                            "smilesPoints",
                                                            e.target.value
                                                          )
                                                        }
                                                        className="h-8 text-xs"
                                                      />
                                                    )}
                                                    {isSavingSmiles && (
                                                      <Loader2 className="w-3.5 h-3.5 animate-spin absolute right-2 top-2 text-orange-500" />
                                                    )}
                                                  </div>
                                                </div>
                                                {/* LATAM PASS */}
                                                <div className="flex items-center gap-2">
                                                  <span className="bg-red-600 text-white px-2 py-1 rounded text-xs font-semibold w-20 text-center flex-shrink-0">
                                                    ✦ LATAM
                                                  </span>
                                                  <div className="relative flex-1">
                                                    <label
                                                      htmlFor={`latam-${week.weekNumber}`}
                                                      className="sr-only"
                                                    >
                                                      Pontos LATAM PASS
                                                    </label>
                                                    {hideValues ? (
                                                      <div className="h-8 rounded-md border border-input bg-muted flex items-center px-3 text-xs text-muted-foreground tracking-widest">
                                                        ••••
                                                      </div>
                                                    ) : (
                                                      <Input
                                                        id={`latam-${week.weekNumber}`}
                                                        type="number"
                                                        placeholder="0 pts"
                                                        aria-label="Pontos LATAM PASS"
                                                        defaultValue={
                                                          currentLatam ?? ""
                                                        }
                                                        key={`${week.weekNumber}-latam-${currentLatam}`}
                                                        onBlur={e =>
                                                          handleMilesBlur(
                                                            week.weekNumber,
                                                            "latamPassPoints",
                                                            e.target.value
                                                          )
                                                        }
                                                        className="h-8 text-xs"
                                                      />
                                                    )}
                                                    {isSavingLatam && (
                                                      <Loader2 className="w-3.5 h-3.5 animate-spin absolute right-2 top-2 text-red-500" />
                                                    )}
                                                  </div>
                                                </div>
                                              </>
                                            );
                                          })()}
                                          {airlines.map(airline => {
                                            const currentPrice =
                                              priceMap[week.weekNumber]?.[
                                                airline.id
                                              ] || "";
                                            const isSaving =
                                              savingPrice?.week ===
                                                week.weekNumber &&
                                              savingPrice?.airline ===
                                                airline.id;
                                            return (
                                              <div
                                                key={airline.id}
                                                className="flex items-center gap-2"
                                              >
                                                <span
                                                  className={`${airline.color} text-white px-2 py-1 rounded text-xs font-semibold w-20 text-center flex-shrink-0`}
                                                >
                                                  {airline.icon} {airline.name}
                                                </span>
                                                <div className="relative flex-1">
                                                  <label
                                                    htmlFor={`airline-${airline.id}-${week.weekNumber}`}
                                                    className="sr-only"
                                                  >
                                                    Preço {airline.name}
                                                  </label>
                                                  {hideValues ? (
                                                    <div className="h-8 rounded-md border border-input bg-muted flex items-center px-3 text-xs text-muted-foreground tracking-widest">
                                                      ••••
                                                    </div>
                                                  ) : (
                                                    <Input
                                                      id={`airline-${airline.id}-${week.weekNumber}`}
                                                      type="number"
                                                      placeholder="R$ 0,00"
                                                      aria-label={`Preço ${airline.name}`}
                                                      defaultValue={
                                                        currentPrice
                                                      }
                                                      key={`${week.weekNumber}-${airline.id}-${currentPrice}`}
                                                      onBlur={e =>
                                                        handlePriceBlur(
                                                          week.weekNumber,
                                                          airline.id,
                                                          e.target.value
                                                        )
                                                      }
                                                      className="h-8 text-xs"
                                                    />
                                                  )}
                                                  {isSaving && (
                                                    <Loader2 className="w-3.5 h-3.5 animate-spin absolute right-2 top-2 text-blue-500" />
                                                  )}
                                                </div>
                                                <Button
                                                  variant="outline"
                                                  size="sm"
                                                  className="h-8 w-8 p-0 flex-shrink-0"
                                                  asChild
                                                >
                                                  <a
                                                    href={generateBookingLink(
                                                      airline.id,
                                                      week.departureDate,
                                                      week.returnDate,
                                                      week.departureDate,
                                                      week.returnDate,
                                                      departureAirport,
                                                      "NVT"
                                                    )}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    title={`Buscar na ${airline.name}`}
                                                    aria-label={`Buscar na ${airline.name}`}
                                                  >
                                                    <ExternalLink className="w-3.5 h-3.5" />
                                                  </a>
                                                </Button>
                                              </div>
                                            );
                                          })}
                                        </div>
                                      </div>
                                    </div>

                                    {/* Coluna direita: Cards Ida/Volta (só quando bilhete emitido) */}
                                    {!!week.isTicketIssued && (
                                      <div className="flex-1 flex flex-col gap-3">
                                        {/* Seletor tipo de bilhete */}
                                        <div className="flex items-center gap-2">
                                          <span className="text-[10px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide">
                                            Tipo de Bilhete
                                          </span>
                                          <div
                                            className="flex rounded-lg overflow-hidden border border-slate-200 shadow-sm"
                                            role="group"
                                            aria-label="Tipo de Bilhete"
                                          >
                                            <button
                                              aria-label="Selecionar ida e volta"
                                              type="button"
                                              aria-pressed={
                                                (tempTicketType[
                                                  week.weekNumber
                                                ] ?? "roundtrip") ===
                                                "roundtrip"
                                              }
                                              onClick={() =>
                                                setTempTicketType(prev => ({
                                                  ...prev,
                                                  [week.weekNumber]:
                                                    "roundtrip",
                                                }))
                                              }
                                              className={`px-3 py-1 text-xs font-semibold transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-inset ${
                                                (tempTicketType[
                                                  week.weekNumber
                                                ] ?? "roundtrip") ===
                                                "roundtrip"
                                                  ? "bg-blue-600 text-white"
                                                  : "bg-white text-slate-500 hover:bg-slate-50"
                                              }`}
                                            >
                                              ✈ Ida e Volta
                                            </button>
                                            <button
                                              aria-label="Selecionar somente ida"
                                              type="button"
                                              aria-pressed={
                                                (tempTicketType[
                                                  week.weekNumber
                                                ] ?? "roundtrip") === "oneway"
                                              }
                                              onClick={() =>
                                                setTempTicketType(prev => ({
                                                  ...prev,
                                                  [week.weekNumber]: "oneway",
                                                }))
                                              }
                                              className={`px-3 py-1 text-xs font-semibold transition-colors border-l border-slate-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-inset ${
                                                (tempTicketType[
                                                  week.weekNumber
                                                ] ?? "roundtrip") === "oneway"
                                                  ? "bg-orange-500 text-white"
                                                  : "bg-white text-slate-500 hover:bg-slate-50"
                                              }`}
                                            >
                                              → Somente Ida
                                            </button>
                                          </div>
                                        </div>

                                        <div
                                          className={`grid gap-3 ${
                                            (tempTicketType[week.weekNumber] ??
                                              "roundtrip") === "oneway"
                                              ? "grid-cols-1"
                                              : "grid-cols-1 sm:grid-cols-2"
                                          }`}
                                        >
                                          {/* Card IDA */}
                                          <div className="rounded-2xl border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-700/50 overflow-hidden shadow-sm dark:shadow-slate-900/40">
                                            <div className="bg-slate-100/50 dark:bg-slate-700 border-b border-slate-200 dark:border-slate-600 px-4 py-2 flex items-center justify-between gap-2">
                                              <div className="flex items-center gap-2">
                                                <Plane className="w-4 h-4 text-slate-400" />
                                                <span className="text-[11px] font-bold text-slate-600 dark:text-slate-200 uppercase tracking-widest">
                                                  Ida
                                                </span>
                                              </div>
                                              <button
                                                type="button"
                                                onClick={() => {
                                                  setTempDepartureAirport(
                                                    (prev: any) => ({
                                                      ...prev,
                                                      [week.weekNumber]: "",
                                                    })
                                                  );
                                                  setTempDepartureAirline(
                                                    (prev: any) => ({
                                                      ...prev,
                                                      [week.weekNumber]: "",
                                                    })
                                                  );
                                                  setTempDepartureDatetime(
                                                    (prev: any) => ({
                                                      ...prev,
                                                      [week.weekNumber]: "",
                                                    })
                                                  );
                                                  setTempDepartureFlightNumber(
                                                    (prev: any) => ({
                                                      ...prev,
                                                      [week.weekNumber]: "",
                                                    })
                                                  );
                                                  setTempDepartureLocator(
                                                    (prev: any) => ({
                                                      ...prev,
                                                      [week.weekNumber]: "",
                                                    })
                                                  );
                                                  setTempDepartureTerminal(
                                                    (prev: any) => ({
                                                      ...prev,
                                                      [week.weekNumber]: "",
                                                    })
                                                  );
                                                  setSuggestedDepartureFlightNumber(
                                                    (prev: any) => ({
                                                      ...prev,
                                                      [week.weekNumber]: false,
                                                    })
                                                  );
                                                }}
                                                className="px-2 py-1 text-[10px] font-semibold text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 transition-colors focus:outline-none focus-visible:ring-1 focus-visible:ring-blue-400"
                                                title="Limpar dados do voo de ida"
                                                aria-label="Limpar dados do voo de ida"
                                              >
                                                🗑️ Limpar
                                              </button>
                                            </div>
                                            <div className="p-3 flex flex-col gap-2.5">
                                              <div className="flex flex-col gap-1">
                                                <label className="text-[10px] font-semibold text-slate-600 dark:text-slate-300 uppercase tracking-wide">
                                                  Aeroporto
                                                </label>
                                                <Select
                                                  value={
                                                    tempDepartureAirport[
                                                      week.weekNumber
                                                    ] ?? ""
                                                  }
                                                  onValueChange={val =>
                                                    setTempDepartureAirport(
                                                      prev => ({
                                                        ...prev,
                                                        [week.weekNumber]: val,
                                                      })
                                                    )
                                                  }
                                                >
                                                  <SelectTrigger
                                                    aria-label={`Aeroporto de Ida, semana ${week.weekNumber}`}
                                                    className="h-8 text-xs bg-white dark:bg-slate-700 border-blue-200 dark:border-blue-600 w-full dark:text-slate-100"
                                                  >
                                                    <SelectValue placeholder="Selecionar aeroporto" />
                                                  </SelectTrigger>
                                                  <SelectContent>
                                                    <SelectItem value="GRU">
                                                      🛫 Guarulhos (GRU)
                                                    </SelectItem>
                                                    <SelectItem value="CGH">
                                                      🛫 Congonhas (CGH)
                                                    </SelectItem>
                                                    <SelectItem value="VCP">
                                                      🛫 Viracopos (VCP)
                                                    </SelectItem>
                                                    <SelectItem value="NVT">
                                                      🛬 Navegantes (NVT)
                                                    </SelectItem>
                                                    <SelectItem value="JOI">
                                                      🛬 Joinville (JOI)
                                                    </SelectItem>
                                                  </SelectContent>
                                                </Select>
                                              </div>
                                              <div className="flex flex-col gap-1">
                                                <div className="flex items-center justify-between">
                                                  <label className="text-[10px] font-semibold text-slate-600 dark:text-slate-300 uppercase tracking-wide">
                                                    Companhia Aérea
                                                  </label>
                                                  {tempDepartureAirline[
                                                    week.weekNumber
                                                  ] && (
                                                    <button
                                                      type="button"
                                                      title="Copiar companhia para Volta"
                                                      aria-label="Copiar companhia para Volta"
                                                      onClick={() =>
                                                        setTempReturnAirline(
                                                          prev => ({
                                                            ...prev,
                                                            [week.weekNumber]:
                                                              tempDepartureAirline[
                                                                week.weekNumber
                                                              ],
                                                          })
                                                        )
                                                      }
                                                      className="flex items-center gap-0.5 text-[10px] font-medium text-blue-500 hover:text-blue-700 bg-blue-50 hover:bg-blue-100 border border-blue-200 rounded px-1.5 py-0.5 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
                                                    >
                                                      <svg
                                                        className="w-3 h-3"
                                                        fill="none"
                                                        viewBox="0 0 24 24"
                                                        stroke="currentColor"
                                                        strokeWidth={2}
                                                      >
                                                        <path
                                                          strokeLinecap="round"
                                                          strokeLinejoin="round"
                                                          d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"
                                                        />
                                                      </svg>
                                                      Copiar → Volta
                                                    </button>
                                                  )}
                                                </div>
                                                <Select
                                                  value={
                                                    tempDepartureAirline[
                                                      week.weekNumber
                                                    ] ?? ""
                                                  }
                                                  onValueChange={val => {
                                                    const prevAirline =
                                                      tempDepartureAirline[
                                                        week.weekNumber
                                                      ] ?? "";
                                                    setTempDepartureAirline(
                                                      prev => ({
                                                        ...prev,
                                                        [week.weekNumber]: val,
                                                      })
                                                    );
                                                    // Preencher Número do Voo com a sigla IATA se:
                                                    //   (a) estiver vazio, OU
                                                    //   (b) contiver exatamente a sigla da companhia anterior (2 chars)
                                                    const newIata =
                                                      airlineIataCodes[val] ??
                                                      val
                                                        .toUpperCase()
                                                        .slice(0, 2);
                                                    const prevIata =
                                                      airlineIataCodes[
                                                        prevAirline
                                                      ] ??
                                                      prevAirline
                                                        .toUpperCase()
                                                        .slice(0, 2);
                                                    const currentFlightNum = (
                                                      tempDepartureFlightNumber[
                                                        week.weekNumber
                                                      ] ?? ""
                                                    ).trim();
                                                    if (
                                                      !currentFlightNum ||
                                                      currentFlightNum ===
                                                        prevIata
                                                    ) {
                                                      setTempDepartureFlightNumber(
                                                        prev => ({
                                                          ...prev,
                                                          [week.weekNumber]:
                                                            newIata,
                                                        })
                                                      );
                                                      setSuggestedDepartureFlightNumber(
                                                        prev => ({
                                                          ...prev,
                                                          [week.weekNumber]: false,
                                                        })
                                                      );
                                                    } else {
                                                      // Sugerir número do voo baseado no histórico apenas se o campo não foi preenchido com IATA
                                                      const suggestion =
                                                        suggestFlightNumber(
                                                          val,
                                                          tempDepartureDatetime[
                                                            week.weekNumber
                                                          ] ?? "",
                                                          "departure",
                                                          weeksData
                                                        );
                                                      if (
                                                        suggestion &&
                                                        !currentFlightNum
                                                      ) {
                                                        setTempDepartureFlightNumber(
                                                          prev => ({
                                                            ...prev,
                                                            [week.weekNumber]:
                                                              suggestion,
                                                          })
                                                        );
                                                        setSuggestedDepartureFlightNumber(
                                                          prev => ({
                                                            ...prev,
                                                            [week.weekNumber]: true,
                                                          })
                                                        );
                                                      }
                                                    }
                                                  }}
                                                >
                                                  <SelectTrigger
                                                    aria-label={`Companhia Aérea de Ida, semana ${week.weekNumber}`}
                                                    className="h-8 text-xs bg-white dark:bg-slate-700 border-blue-200 dark:border-blue-600 w-full dark:text-slate-100"
                                                  >
                                                    <SelectValue placeholder="Selecionar companhia">
                                                      {tempDepartureAirline[
                                                        week.weekNumber
                                                      ] === "latam" && (
                                                        <span className="flex items-center gap-1.5">
                                                          <img
                                                            src={AIRLINE_LOGO_ASSETS.latam}
                                                            className="h-4 w-auto object-contain"
                                                            alt="LATAM"
                                                          />
                                                          LATAM
                                                        </span>
                                                      )}
                                                      {tempDepartureAirline[
                                                        week.weekNumber
                                                      ] === "gol" && (
                                                        <span className="flex items-center gap-1.5">
                                                          <img
                                                            src={AIRLINE_LOGO_ASSETS.gol}
                                                            className="h-4 w-auto object-contain"
                                                            alt="Gol"
                                                          />
                                                          Gol
                                                        </span>
                                                      )}
                                                      {tempDepartureAirline[
                                                        week.weekNumber
                                                      ] === "azul" && (
                                                        <span className="flex items-center gap-1.5">
                                                          <img
                                                            src={AIRLINE_LOGO_ASSETS.azul}
                                                            className="h-4 w-auto object-contain"
                                                            alt="Azul"
                                                          />
                                                          Azul
                                                        </span>
                                                      )}
                                                      {!tempDepartureAirline[
                                                        week.weekNumber
                                                      ] && (
                                                        <span className="text-slate-400">
                                                          Selecionar companhia
                                                        </span>
                                                      )}
                                                    </SelectValue>
                                                  </SelectTrigger>
                                                  <SelectContent>
                                                    <SelectItem value="latam">
                                                      <span className="flex items-center gap-2">
                                                        <img
                                                          src={AIRLINE_LOGO_ASSETS.latam}
                                                          className="h-5 w-auto object-contain"
                                                          alt="LATAM"
                                                        />
                                                        LATAM
                                                      </span>
                                                    </SelectItem>
                                                    <SelectItem value="gol">
                                                      <span className="flex items-center gap-2">
                                                        <img
                                                          src={AIRLINE_LOGO_ASSETS.gol}
                                                          className="h-5 w-auto object-contain"
                                                          alt="Gol"
                                                        />
                                                        Gol
                                                      </span>
                                                    </SelectItem>
                                                    <SelectItem value="azul">
                                                      <span className="flex items-center gap-2">
                                                        <img
                                                          src={AIRLINE_LOGO_ASSETS.azul}
                                                          className="h-5 w-auto object-contain"
                                                          alt="Azul"
                                                        />
                                                        Azul
                                                      </span>
                                                    </SelectItem>
                                                  </SelectContent>
                                                </Select>
                                              </div>
                                              <div className="flex flex-col gap-1">
                                                <label
                                                  htmlFor={`departure-datetime-${week.weekNumber}`}
                                                  className="text-[10px] font-semibold text-slate-600 dark:text-slate-300 uppercase tracking-wide"
                                                >
                                                  Data e Hora do Voo
                                                </label>
                                                <input
                                                  id={`departure-datetime-${week.weekNumber}`}
                                                  aria-label="Data e Hora do Voo de Ida"
                                                  type="datetime-local"
                                                  className="h-8 text-xs border border-blue-200 dark:border-blue-600 rounded-md px-2 bg-white dark:bg-slate-700 text-slate-700 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-400 dark:focus:ring-blue-500 w-full"
                                                  value={
                                                    tempDepartureDatetime[
                                                      week.weekNumber
                                                    ] ||
                                                    (() => {
                                                      // Fallback: usar valor do banco ou data da semana com 00:00
                                                      const saved =
                                                        week.departureFlightDatetime ??
                                                        "";
                                                      if (saved) return saved;
                                                      return week.departureDate &&
                                                        week.departureDate
                                                          .length === 10
                                                        ? `${week.departureDate.substring(6, 10)}-${week.departureDate.substring(3, 5)}-${week.departureDate.substring(0, 2)}T00:00`
                                                        : "";
                                                    })()
                                                  }
                                                  onChange={e =>
                                                    setTempDepartureDatetime(
                                                      prev => ({
                                                        ...prev,
                                                        [week.weekNumber]:
                                                          e.target.value,
                                                      })
                                                    )
                                                  }
                                                />
                                                {(() => {
                                                  // Suporta tanto 'YYYY-MM-DD' (só data) quanto 'YYYY-MM-DDTHH:mm' (data+hora)
                                                  const raw =
                                                    tempDepartureDatetime[
                                                      week.weekNumber
                                                    ] ||
                                                    (() => {
                                                      const saved =
                                                        week.departureFlightDatetime ??
                                                        "";
                                                      if (saved) return saved;
                                                      return week.departureDate &&
                                                        week.departureDate
                                                          .length === 10
                                                        ? `${week.departureDate.substring(6, 10)}-${week.departureDate.substring(3, 5)}-${week.departureDate.substring(0, 2)}T00:00`
                                                        : "";
                                                    })();
                                                  if (!raw) return null;
                                                  const iso = raw.includes("T")
                                                    ? raw
                                                    : raw + "T12:00";
                                                  const d = new Date(iso);
                                                  if (isNaN(d.getTime()))
                                                    return null;
                                                  const label =
                                                    d.toLocaleDateString(
                                                      "pt-BR",
                                                      { weekday: "long" }
                                                    );
                                                  return (
                                                    <span className="text-[11px] font-semibold text-blue-700 bg-blue-100 px-2 py-0.5 rounded-md w-fit">
                                                      {label
                                                        .charAt(0)
                                                        .toUpperCase() +
                                                        label.slice(1)}
                                                    </span>
                                                  );
                                                })()}
                                              </div>
                                              <div className="flex flex-col gap-1">
                                                <div className="flex items-center justify-between">
                                                  <label
                                                    htmlFor={`departure-flight-number-${week.weekNumber}`}
                                                    className="text-[10px] font-semibold text-slate-600 dark:text-slate-300 uppercase tracking-wide"
                                                  >
                                                    Número do Voo
                                                  </label>
                                                  {suggestedDepartureFlightNumber[
                                                    week.weekNumber
                                                  ] && (
                                                    <span
                                                      title="Sugerido pelo histórico de voos anteriores. Confirme ou edite."
                                                      className="flex items-center gap-0.5 text-[10px] font-medium text-amber-600 bg-amber-50 border border-amber-200 rounded px-1.5 py-0.5 cursor-default"
                                                    >
                                                      <Wand2 className="w-2.5 h-2.5" />
                                                      Sugerido
                                                    </span>
                                                  )}
                                                </div>
                                                <input
                                                  id={`departure-flight-number-${week.weekNumber}`}
                                                  aria-label="Número do Voo de Ida"
                                                  type="text"
                                                  maxLength={10}
                                                  placeholder="Ex: LA3045"
                                                  className={`h-8 text-xs rounded-md px-2 bg-white text-slate-700 uppercase font-mono focus:outline-none focus:ring-2 w-full transition-colors ${
                                                    suggestedDepartureFlightNumber[
                                                      week.weekNumber
                                                    ]
                                                      ? "border border-amber-300 focus:ring-amber-400"
                                                      : "border border-blue-200 focus:ring-blue-400"
                                                  }`}
                                                  value={
                                                    tempDepartureFlightNumber[
                                                      week.weekNumber
                                                    ] ?? ""
                                                  }
                                                  onChange={e => {
                                                    setTempDepartureFlightNumber(
                                                      prev => ({
                                                        ...prev,
                                                        [week.weekNumber]:
                                                          e.target.value.toUpperCase(),
                                                      })
                                                    );
                                                    // Ao editar manualmente, remover o indicador de sugestão
                                                    setSuggestedDepartureFlightNumber(
                                                      prev => ({
                                                        ...prev,
                                                        [week.weekNumber]: false,
                                                      })
                                                    );
                                                  }}
                                                />
                                              </div>
                                              <div className="flex flex-col gap-1">
                                                <div className="flex items-center justify-between">
                                                  <label
                                                    htmlFor={`departure-locator-${week.weekNumber}`}
                                                    className="text-[10px] font-semibold text-slate-600 dark:text-slate-300 uppercase tracking-wide"
                                                  >
                                                    Localizador (PNR)
                                                  </label>
                                                  {(
                                                    tempDepartureLocator[
                                                      week.weekNumber
                                                    ] ?? ""
                                                  ).trim() && (
                                                    <button
                                                      type="button"
                                                      title="Copiar localizador para Volta"
                                                      aria-label="Copiar localizador para Volta"
                                                      onClick={() =>
                                                        setTempReturnLocator(
                                                          prev => ({
                                                            ...prev,
                                                            [week.weekNumber]:
                                                              tempDepartureLocator[
                                                                week.weekNumber
                                                              ],
                                                          })
                                                        )
                                                      }
                                                      className="flex items-center gap-0.5 text-[10px] font-medium text-blue-500 hover:text-blue-700 bg-blue-50 hover:bg-blue-100 border border-blue-200 rounded px-1.5 py-0.5 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
                                                    >
                                                      <svg
                                                        className="w-3 h-3"
                                                        fill="none"
                                                        viewBox="0 0 24 24"
                                                        stroke="currentColor"
                                                        strokeWidth={2}
                                                      >
                                                        <path
                                                          strokeLinecap="round"
                                                          strokeLinejoin="round"
                                                          d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"
                                                        />
                                                      </svg>
                                                      Copiar → Volta
                                                    </button>
                                                  )}
                                                </div>
                                                <input
                                                  id={`departure-locator-${week.weekNumber}`}
                                                  aria-label="Localizador do Voo de Ida"
                                                  type="text"
                                                  maxLength={20}
                                                  placeholder="Ex: ABC123"
                                                  className="h-8 text-xs border border-blue-200 rounded-md px-2 bg-white text-slate-700 uppercase font-mono focus:outline-none focus:ring-2 focus:ring-blue-400 w-full"
                                                  value={
                                                    tempDepartureLocator[
                                                      week.weekNumber
                                                    ] ?? ""
                                                  }
                                                  onChange={e =>
                                                    setTempDepartureLocator(
                                                      prev => ({
                                                        ...prev,
                                                        [week.weekNumber]:
                                                          e.target.value.toUpperCase(),
                                                      })
                                                    )
                                                  }
                                                />
                                              </div>
                                              <div className="flex flex-col gap-1">
                                                <label
                                                  htmlFor={`departure-terminal-${week.weekNumber}`}
                                                  className="text-[10px] font-semibold text-slate-600 dark:text-slate-300 uppercase tracking-wide"
                                                >
                                                  Terminal
                                                </label>
                                                <input
                                                  id={`departure-terminal-${week.weekNumber}`}
                                                  aria-label="Terminal do Voo de Ida"
                                                  type="text"
                                                  maxLength={20}
                                                  placeholder="Ex: Terminal 2"
                                                  className="h-8 text-xs border border-blue-200 dark:border-blue-600 rounded-md px-2 bg-white dark:bg-slate-700 text-slate-700 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-400 dark:focus:ring-blue-500 w-full"
                                                  value={
                                                    tempDepartureTerminal[
                                                      week.weekNumber
                                                    ] ?? week.departureTerminal ?? ""
                                                  }
                                                  onChange={e =>
                                                    setTempDepartureTerminal(
                                                      prev => ({
                                                        ...prev,
                                                        [week.weekNumber]:
                                                          e.target.value,
                                                      })
                                                    )
                                                  }
                                                />
                                              </div>
                                              {/* Checkbox Voo Remarcado - Ida */}
                                              <div className="flex items-center gap-2 pt-1">
                                                <Checkbox
                                                  id={`departure-rescheduled-${week.weekNumber}`}
                                                  checked={
                                                    week.departureRescheduled ===
                                                    1
                                                  }
                                                  onCheckedChange={checked => {
                                                    if (!isAuthenticated) {
                                                      setShowLoginModal(true);
                                                      return;
                                                    }
                                                    updateStatusMutation.mutate(
                                                      {
                                                        weekNumber:
                                                          week.weekNumber,
                                                        year: selectedYear,
                                                        departureRescheduled:
                                                          checked ? 1 : 0,
                                                        departureCancelled:
                                                          checked ? 0 : week.departureCancelled,
                                                        isTicketIssued:
                                                          week.isTicketIssued,
                                                      },
                                                      {
                                                        onSuccess: () => {
                                                          utils.flights.getWeeks.invalidate({
                                                            year: selectedYear,
                                                          });
                                                          toast.success(
                                                            checked
                                                              ? "Voo de ida marcado como remarcado"
                                                              : "Voo de ida desmarcado como remarcado"
                                                          );
                                                        },
                                                        onError: () =>
                                                          toast.error(
                                                            "Erro ao atualizar status de voo remarcado"
                                                          ),
                                                      }
                                                    );
                                                  }}
                                                  className="border-red-400 data-[state=checked]:bg-red-500 data-[state=checked]:border-red-500"
                                                />
                                                <label
                                                  htmlFor={`departure-rescheduled-${week.weekNumber}`}
                                                  className="text-[10px] font-semibold text-red-600 dark:text-red-400 uppercase tracking-wide cursor-pointer"
                                                >
                                                  Voo Remarcado
                                                </label>
                                              </div>
                                              <div className="flex items-center gap-2 pt-1">
                                                <Checkbox
                                                  id={`departure-cancelled-${week.weekNumber}`}
                                                  checked={week.departureCancelled === 1}
                                                  onCheckedChange={checked => {
                                                    if (!isAuthenticated) {
                                                      setShowLoginModal(true);
                                                      return;
                                                    }
                                                    updateStatusMutation.mutate(
                                                      {
                                                        weekNumber: week.weekNumber,
                                                        year: selectedYear,
                                                        departureCancelled: checked ? 1 : 0,
                                                        departureRescheduled:
                                                          checked ? 0 : week.departureRescheduled,
                                                        isTicketIssued: week.isTicketIssued,
                                                      },
                                                      {
                                                        onSuccess: () => {
                                                          utils.flights.getWeeks.invalidate({ year: selectedYear });
                                                          toast.success(
                                                            checked
                                                              ? "Voo de ida marcado como cancelado"
                                                              : "Voo de ida desmarcado como cancelado"
                                                          );
                                                        },
                                                        onError: () => toast.error("Erro ao atualizar cancelamento do voo de ida"),
                                                      }
                                                    );
                                                  }}
                                                  className="border-slate-500 data-[state=checked]:bg-slate-700 data-[state=checked]:border-slate-700"
                                                />
                                                <label
                                                  htmlFor={`departure-cancelled-${week.weekNumber}`}
                                                  className="text-[10px] font-semibold text-slate-700 dark:text-slate-200 uppercase tracking-wide cursor-pointer"
                                                >
                                                  Voo Cancelado
                                                </label>
                                              </div>
                                            </div>
                                          </div>

                                          {/* Card VOLTA — só exibido quando tipo é Ida e Volta */}
                                          {(tempTicketType[week.weekNumber] ??
                                            "roundtrip") === "roundtrip" && (
                                            <div className="rounded-2xl border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-700/50 overflow-hidden shadow-sm dark:shadow-slate-900/40">
                                              <div className="bg-slate-100/50 dark:bg-slate-700 border-b border-slate-200 dark:border-slate-600 px-4 py-2 flex items-center justify-between gap-2">
                                                <div className="flex items-center gap-2">
                                                  <Plane className="w-4 h-4 text-slate-400 rotate-180" />
                                                  <span className="text-[11px] font-bold text-slate-600 dark:text-slate-200 uppercase tracking-widest">
                                                    Volta
                                                  </span>
                                                </div>
                                                <button
                                                  type="button"
                                                  onClick={() => {
                                                    setTempReturnAirport(
                                                      (prev: any) => ({
                                                        ...prev,
                                                        [week.weekNumber]: "",
                                                      })
                                                    );
                                                    setTempReturnAirline(
                                                      (prev: any) => ({
                                                        ...prev,
                                                        [week.weekNumber]: "",
                                                      })
                                                    );
                                                    setTempReturnDatetime(
                                                      (prev: any) => ({
                                                        ...prev,
                                                        [week.weekNumber]: "",
                                                      })
                                                    );
                                                    setTempReturnFlightNumber(
                                                      (prev: any) => ({
                                                        ...prev,
                                                        [week.weekNumber]: "",
                                                      })
                                                    );
                                                  setTempReturnLocator(
                                                    (prev: any) => ({
                                                      ...prev,
                                                      [week.weekNumber]: "",
                                                    })
                                                  );
                                                  setTempReturnTerminal(
                                                    (prev: any) => ({
                                                      ...prev,
                                                      [week.weekNumber]: "",
                                                    })
                                                  );
                                                    setSuggestedReturnFlightNumber(
                                                      (prev: any) => ({
                                                        ...prev,
                                                        [week.weekNumber]: false,
                                                      })
                                                    );
                                                  }}
                                                  className="px-2 py-1 text-[10px] font-semibold text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 transition-colors focus:outline-none focus-visible:ring-1 focus-visible:ring-orange-400"
                                                  title="Limpar dados do voo de volta"
                                                  aria-label="Limpar dados do voo de volta"
                                                >
                                                  🗑️ Limpar
                                                </button>
                                              </div>
                                              <div className="p-3 flex flex-col gap-2.5">
                                                <div className="flex flex-col gap-1">
                                                  <label className="text-[10px] font-semibold text-slate-600 dark:text-slate-300 uppercase tracking-wide">
                                                    Aeroporto
                                                  </label>
                                                  <Select
                                                    value={
                                                      tempReturnAirport[
                                                        week.weekNumber
                                                      ] ?? ""
                                                    }
                                                    onValueChange={val =>
                                                      setTempReturnAirport(
                                                        prev => ({
                                                          ...prev,
                                                          [week.weekNumber]:
                                                            val,
                                                        })
                                                      )
                                                    }
                                                  >
                                                    <SelectTrigger
                                                      aria-label={`Aeroporto de Volta, semana ${week.weekNumber}`}
                                                      className="h-8 text-xs bg-white dark:bg-slate-700 border-orange-200 dark:border-orange-600 w-full dark:text-slate-100"
                                                    >
                                                      <SelectValue placeholder="Selecionar aeroporto" />
                                                    </SelectTrigger>
                                                    <SelectContent>
                                                      <SelectItem value="GRU">
                                                        🛫 Guarulhos (GRU)
                                                      </SelectItem>
                                                      <SelectItem value="CGH">
                                                        🛫 Congonhas (CGH)
                                                      </SelectItem>
                                                      <SelectItem value="VCP">
                                                        🛫 Viracopos (VCP)
                                                      </SelectItem>
                                                      <SelectItem value="NVT">
                                                        🛬 Navegantes (NVT)
                                                      </SelectItem>
                                                      <SelectItem value="JOI">
                                                        🛬 Joinville (JOI)
                                                      </SelectItem>
                                                    </SelectContent>
                                                  </Select>
                                                </div>
                                                <div className="flex flex-col gap-1">
                                                  <label className="text-[10px] font-semibold text-slate-600 dark:text-slate-300 uppercase tracking-wide">
                                                    Companhia Aérea
                                                  </label>
                                                  <Select
                                                    value={
                                                      tempReturnAirline[
                                                        week.weekNumber
                                                      ] ?? ""
                                                    }
                                                    onValueChange={val => {
                                                      const prevAirline =
                                                        tempReturnAirline[
                                                          week.weekNumber
                                                        ] ?? "";
                                                      setTempReturnAirline(
                                                        prev => ({
                                                          ...prev,
                                                          [week.weekNumber]:
                                                            val,
                                                        })
                                                      );
                                                      // Preencher Número do Voo com a sigla IATA se:
                                                      //   (a) estiver vazio, OU
                                                      //   (b) contiver exatamente a sigla da companhia anterior (2 chars)
                                                      const newIata =
                                                        airlineIataCodes[val] ??
                                                        val
                                                          .toUpperCase()
                                                          .slice(0, 2);
                                                      const prevIata =
                                                        airlineIataCodes[
                                                          prevAirline
                                                        ] ??
                                                        prevAirline
                                                          .toUpperCase()
                                                          .slice(0, 2);
                                                      const currentFlightNum = (
                                                        tempReturnFlightNumber[
                                                          week.weekNumber
                                                        ] ?? ""
                                                      ).trim();
                                                      if (
                                                        !currentFlightNum ||
                                                        currentFlightNum ===
                                                          prevIata
                                                      ) {
                                                        setTempReturnFlightNumber(
                                                          prev => ({
                                                            ...prev,
                                                            [week.weekNumber]:
                                                              newIata,
                                                          })
                                                        );
                                                        setSuggestedReturnFlightNumber(
                                                          prev => ({
                                                            ...prev,
                                                            [week.weekNumber]: false,
                                                          })
                                                        );
                                                      } else {
                                                        // Sugerir número do voo baseado no histórico apenas se o campo não foi preenchido com IATA
                                                        const suggestion =
                                                          suggestFlightNumber(
                                                            val,
                                                            tempReturnDatetime[
                                                              week.weekNumber
                                                            ] ?? "",
                                                            "return",
                                                            weeksData
                                                          );
                                                        if (
                                                          suggestion &&
                                                          !currentFlightNum
                                                        ) {
                                                          setTempReturnFlightNumber(
                                                            prev => ({
                                                              ...prev,
                                                              [week.weekNumber]:
                                                                suggestion,
                                                            })
                                                          );
                                                          setSuggestedReturnFlightNumber(
                                                            prev => ({
                                                              ...prev,
                                                              [week.weekNumber]: true,
                                                            })
                                                          );
                                                        }
                                                      }
                                                    }}
                                                  >
                                                    <SelectTrigger
                                                      aria-label={`Companhia Aérea de Volta, semana ${week.weekNumber}`}
                                                      className="h-8 text-xs bg-white dark:bg-slate-700 border-orange-200 dark:border-orange-600 w-full dark:text-slate-100"
                                                    >
                                                      <SelectValue placeholder="Selecionar companhia">
                                                        {tempReturnAirline[
                                                          week.weekNumber
                                                        ] === "latam" && (
                                                          <span className="flex items-center gap-1.5">
                                                            <img
                                                              src={AIRLINE_LOGO_ASSETS.latam}
                                                              className="h-4 w-auto object-contain"
                                                              alt="LATAM"
                                                            />
                                                            LATAM
                                                          </span>
                                                        )}
                                                        {tempReturnAirline[
                                                          week.weekNumber
                                                        ] === "gol" && (
                                                          <span className="flex items-center gap-1.5">
                                                            <img
                                                              src={AIRLINE_LOGO_ASSETS.gol}
                                                              className="h-4 w-auto object-contain"
                                                              alt="Gol"
                                                            />
                                                            Gol
                                                          </span>
                                                        )}
                                                        {tempReturnAirline[
                                                          week.weekNumber
                                                        ] === "azul" && (
                                                          <span className="flex items-center gap-1.5">
                                                            <img
                                                              src={AIRLINE_LOGO_ASSETS.azul}
                                                              className="h-4 w-auto object-contain"
                                                              alt="Azul"
                                                            />
                                                            Azul
                                                          </span>
                                                        )}
                                                        {!tempReturnAirline[
                                                          week.weekNumber
                                                        ] && (
                                                          <span className="text-slate-400">
                                                            Selecionar companhia
                                                          </span>
                                                        )}
                                                      </SelectValue>
                                                    </SelectTrigger>
                                                    <SelectContent>
                                                      <SelectItem value="latam">
                                                        <span className="flex items-center gap-2">
                                                          <img
                                                            src={AIRLINE_LOGO_ASSETS.latam}
                                                            className="h-5 w-auto object-contain"
                                                            alt="LATAM"
                                                          />
                                                          LATAM
                                                        </span>
                                                      </SelectItem>
                                                      <SelectItem value="gol">
                                                        <span className="flex items-center gap-2">
                                                          <img
                                                            src={AIRLINE_LOGO_ASSETS.gol}
                                                            className="h-5 w-auto object-contain"
                                                            alt="Gol"
                                                          />
                                                          Gol
                                                        </span>
                                                      </SelectItem>
                                                      <SelectItem value="azul">
                                                        <span className="flex items-center gap-2">
                                                          <img
                                                            src={AIRLINE_LOGO_ASSETS.azul}
                                                            className="h-5 w-auto object-contain"
                                                            alt="Azul"
                                                          />
                                                          Azul
                                                        </span>
                                                      </SelectItem>
                                                    </SelectContent>
                                                  </Select>
                                                </div>
                                                <div className="flex flex-col gap-1">
                                                  <label
                                                    htmlFor={`return-datetime-${week.weekNumber}`}
                                                    className="text-[10px] font-semibold text-slate-600 dark:text-slate-300 uppercase tracking-wide"
                                                  >
                                                    Data e Hora do Voo
                                                  </label>
                                                  <input
                                                    id={`return-datetime-${week.weekNumber}`}
                                                    aria-label="Data e Hora do Voo de Volta"
                                                    type="datetime-local"
                                                    className="h-8 text-xs border border-orange-200 rounded-md px-2 bg-white text-slate-700 focus:outline-none focus:ring-2 focus:ring-orange-400 w-full"
                                                    value={
                                                      tempReturnDatetime[
                                                        week.weekNumber
                                                      ] ||
                                                      (() => {
                                                        // Fallback: usar valor do banco ou data da semana com 00:00
                                                        const saved =
                                                          week.returnFlightDatetime ??
                                                          "";
                                                        if (saved) return saved;
                                                        return week.returnDate &&
                                                          week.returnDate
                                                            .length === 10
                                                          ? `${week.returnDate.substring(6, 10)}-${week.returnDate.substring(3, 5)}-${week.returnDate.substring(0, 2)}T00:00`
                                                          : "";
                                                      })()
                                                    }
                                                    onChange={e =>
                                                      setTempReturnDatetime(
                                                        prev => ({
                                                          ...prev,
                                                          [week.weekNumber]:
                                                            e.target.value,
                                                        })
                                                      )
                                                    }
                                                  />
                                                  {(() => {
                                                    const rawRet =
                                                      tempReturnDatetime[
                                                        week.weekNumber
                                                      ] ||
                                                      (() => {
                                                        const saved =
                                                          week.returnFlightDatetime ??
                                                          "";
                                                        if (saved) return saved;
                                                        return week.returnDate &&
                                                          week.returnDate
                                                            .length === 10
                                                          ? `${week.returnDate.substring(6, 10)}-${week.returnDate.substring(3, 5)}-${week.returnDate.substring(0, 2)}T00:00`
                                                          : "";
                                                      })();
                                                    if (!rawRet) return null;
                                                    return (
                                                      <span className="text-[11px] font-semibold text-orange-700 bg-orange-100 px-2 py-0.5 rounded-md w-fit">
                                                        {(() => {
                                                          // Suporta tanto 'YYYY-MM-DD' (só data) quanto 'YYYY-MM-DDTHH:mm' (data+hora)
                                                          const raw = rawRet;
                                                          const iso =
                                                            raw.includes("T")
                                                              ? raw
                                                              : raw + "T12:00";
                                                          const d = new Date(
                                                            iso
                                                          );
                                                          if (
                                                            isNaN(d.getTime())
                                                          )
                                                            return "Data inválida";
                                                          const label =
                                                            d.toLocaleDateString(
                                                              "pt-BR",
                                                              {
                                                                weekday: "long",
                                                              }
                                                            );
                                                          return (
                                                            label
                                                              .charAt(0)
                                                              .toUpperCase() +
                                                            label.slice(1)
                                                          );
                                                        })()}
                                                      </span>
                                                    );
                                                  })()}
                                                </div>
                                                <div className="flex flex-col gap-1">
                                                  <div className="flex items-center justify-between">
                                                    <label
                                                      htmlFor={`return-flight-number-${week.weekNumber}`}
                                                      className="text-[10px] font-semibold text-slate-600 dark:text-slate-300 uppercase tracking-wide"
                                                    >
                                                      Número do Voo
                                                    </label>
                                                    {suggestedReturnFlightNumber[
                                                      week.weekNumber
                                                    ] && (
                                                      <span
                                                        title="Sugerido pelo histórico de voos anteriores. Confirme ou edite."
                                                        className="flex items-center gap-0.5 text-[10px] font-medium text-amber-600 bg-amber-50 border border-amber-200 rounded px-1.5 py-0.5 cursor-default"
                                                      >
                                                        <Wand2 className="w-2.5 h-2.5" />
                                                        Sugerido
                                                      </span>
                                                    )}
                                                  </div>
                                                  <input
                                                    id={`return-flight-number-${week.weekNumber}`}
                                                    aria-label="Número do Voo de Volta"
                                                    type="text"
                                                    maxLength={10}
                                                    placeholder="Ex: G31234"
                                                    className={`h-8 text-xs rounded-md px-2 bg-white text-slate-700 uppercase font-mono focus:outline-none focus:ring-2 w-full transition-colors ${
                                                      suggestedReturnFlightNumber[
                                                        week.weekNumber
                                                      ]
                                                        ? "border border-amber-300 focus:ring-amber-400"
                                                        : "border border-orange-200 focus:ring-orange-400"
                                                    }`}
                                                    value={
                                                      tempReturnFlightNumber[
                                                        week.weekNumber
                                                      ] ?? ""
                                                    }
                                                    onChange={e => {
                                                      setTempReturnFlightNumber(
                                                        prev => ({
                                                          ...prev,
                                                          [week.weekNumber]:
                                                            e.target.value.toUpperCase(),
                                                        })
                                                      );
                                                      // Ao editar manualmente, remover o indicador de sugestão
                                                      setSuggestedReturnFlightNumber(
                                                        prev => ({
                                                          ...prev,
                                                          [week.weekNumber]: false,
                                                        })
                                                      );
                                                    }}
                                                  />
                                                </div>
                                                <div className="flex flex-col gap-1">
                                                  <label
                                                    htmlFor={`return-locator-${week.weekNumber}`}
                                                    className="text-[10px] font-semibold text-slate-600 dark:text-slate-300 uppercase tracking-wide"
                                                  >
                                                    Localizador (PNR)
                                                  </label>
                                                  <input
                                                    id={`return-locator-${week.weekNumber}`}
                                                    aria-label="Localizador do Voo de Volta"
                                                    type="text"
                                                    maxLength={20}
                                                    placeholder="Ex: XYZ456"
                                                    className="h-8 text-xs border border-orange-200 dark:border-orange-600 rounded-md px-2 bg-white dark:bg-slate-700 text-slate-700 dark:text-slate-100 uppercase font-mono focus:outline-none focus:ring-2 focus:ring-orange-400 dark:focus:ring-orange-500 w-full"
                                                    value={
                                                      tempReturnLocator[
                                                        week.weekNumber
                                                      ] ?? ""
                                                    }
                                                    onChange={e =>
                                                      setTempReturnLocator(
                                                        prev => ({
                                                          ...prev,
                                                          [week.weekNumber]:
                                                            e.target.value.toUpperCase(),
                                                        })
                                                      )
                                                    }
                                                  />
                                                </div>
                                                <div className="flex flex-col gap-1">
                                                  <label
                                                    htmlFor={`return-terminal-${week.weekNumber}`}
                                                    className="text-[10px] font-semibold text-slate-600 dark:text-slate-300 uppercase tracking-wide"
                                                  >
                                                    Terminal
                                                  </label>
                                                  <input
                                                    id={`return-terminal-${week.weekNumber}`}
                                                    aria-label="Terminal do Voo de Volta"
                                                    type="text"
                                                    maxLength={20}
                                                    placeholder="Ex: Terminal 1"
                                                    className="h-8 text-xs border border-orange-200 dark:border-orange-600 rounded-md px-2 bg-white dark:bg-slate-700 text-slate-700 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-orange-400 dark:focus:ring-orange-500 w-full"
                                                    value={
                                                      tempReturnTerminal[
                                                        week.weekNumber
                                                      ] ?? week.returnTerminal ?? ""
                                                    }
                                                    onChange={e =>
                                                      setTempReturnTerminal(
                                                        prev => ({
                                                          ...prev,
                                                          [week.weekNumber]:
                                                            e.target.value,
                                                        })
                                                      )
                                                    }
                                                  />
                                                </div>
                                                {/* Checkbox Voo Remarcado - Volta */}
                                                <div className="flex items-center gap-2 pt-1">
                                                  <Checkbox
                                                    id={`return-rescheduled-${week.weekNumber}`}
                                                    checked={
                                                      week.returnRescheduled ===
                                                      1
                                                    }
                                                    onCheckedChange={checked => {
                                                      if (!isAuthenticated) {
                                                        setShowLoginModal(true);
                                                        return;
                                                      }
                                                      updateStatusMutation.mutate(
                                                        {
                                                          weekNumber:
                                                            week.weekNumber,
                                                          year: selectedYear,
                                                          returnRescheduled:
                                                            checked ? 1 : 0,
                                                          returnCancelled:
                                                            checked ? 0 : week.returnCancelled,
                                                          isTicketIssued:
                                                            week.isTicketIssued,
                                                        },
                                                        {
                                                          onSuccess: () => {
                                                            utils.flights.getWeeks.invalidate({
                                                              year: selectedYear,
                                                            });
                                                            toast.success(
                                                              checked
                                                                ? "Voo de volta marcado como remarcado"
                                                                : "Voo de volta desmarcado como remarcado"
                                                            );
                                                          },
                                                          onError: () =>
                                                            toast.error(
                                                              "Erro ao atualizar status de voo remarcado"
                                                            ),
                                                        }
                                                      );
                                                    }}
                                                    className="border-red-400 data-[state=checked]:bg-red-500 data-[state=checked]:border-red-500"
                                                  />
                                                  <label
                                                    htmlFor={`return-rescheduled-${week.weekNumber}`}
                                                    className="text-[10px] font-semibold text-red-600 dark:text-red-400 uppercase tracking-wide cursor-pointer"
                                                  >
                                                    Voo Remarcado
                                                  </label>
                                                </div>
                                                <div className="flex items-center gap-2 pt-1">
                                                  <Checkbox
                                                    id={`return-cancelled-${week.weekNumber}`}
                                                    checked={week.returnCancelled === 1}
                                                    onCheckedChange={checked => {
                                                      if (!isAuthenticated) {
                                                        setShowLoginModal(true);
                                                        return;
                                                      }
                                                      updateStatusMutation.mutate(
                                                        {
                                                          weekNumber: week.weekNumber,
                                                          year: selectedYear,
                                                          returnCancelled: checked ? 1 : 0,
                                                          returnRescheduled:
                                                            checked ? 0 : week.returnRescheduled,
                                                          isTicketIssued: week.isTicketIssued,
                                                        },
                                                        {
                                                          onSuccess: () => {
                                                            utils.flights.getWeeks.invalidate({ year: selectedYear });
                                                            toast.success(
                                                              checked
                                                                ? "Voo de volta marcado como cancelado"
                                                                : "Voo de volta desmarcado como cancelado"
                                                            );
                                                          },
                                                          onError: () => toast.error("Erro ao atualizar cancelamento do voo de volta"),
                                                        }
                                                      );
                                                    }}
                                                    className="border-slate-500 data-[state=checked]:bg-slate-700 data-[state=checked]:border-slate-700"
                                                  />
                                                  <label
                                                    htmlFor={`return-cancelled-${week.weekNumber}`}
                                                    className="text-[10px] font-semibold text-slate-700 dark:text-slate-200 uppercase tracking-wide cursor-pointer"
                                                  >
                                                    Voo Cancelado
                                                  </label>
                                                </div>
                                              </div>
                                            </div>
                                          )}
                                        </div>

                                        {/* Botão único Salvar — persiste todos os campos de uma vez */}
                                        <button
                                          aria-label={`Salvar dados do bilhete da semana ${week.weekNumber}`}
                                          disabled={
                                            savingTicket[week.weekNumber]
                                          }
                                          className="w-full py-3 rounded-2xl bg-slate-900 text-white text-sm font-semibold shadow-lg hover:bg-slate-800 active:scale-[0.98] transition-all flex items-center justify-center gap-2 disabled:opacity-60 focus:outline-none focus-visible:ring-2 focus-visible:ring-slate-900 focus-visible:ring-offset-2"
                                          onClick={() => {
                                            if (!isAuthenticated) {
                                              setShowLoginModal(true);
                                              return;
                                            }
                                            setSavingTicket(prev => ({
                                              ...prev,
                                              [week.weekNumber]: true,
                                            }));
                                            setSavedTicket(prev => ({
                                              ...prev,
                                              [week.weekNumber]: false,
                                            }));
                                            updateStatusMutation.mutate(
                                              {
                                                year: selectedYear,
                                                weekNumber: week.weekNumber,
                                                departureAirport:
                                                  tempDepartureAirport[
                                                    week.weekNumber
                                                  ] || null,
                                                returnAirport:
                                                  tempReturnAirport[
                                                    week.weekNumber
                                                  ] || null,
                                                departureAirline:
                                                  tempDepartureAirline[
                                                    week.weekNumber
                                                  ] || null,
                                                returnAirline:
                                                  tempReturnAirline[
                                                    week.weekNumber
                                                  ] || null,
                                                departureFlightNumber:
                                                  (
                                                    tempDepartureFlightNumber[
                                                      week.weekNumber
                                                    ] ?? ""
                                                  ).trim() || null,
                                                returnFlightNumber:
                                                  (
                                                    tempReturnFlightNumber[
                                                      week.weekNumber
                                                    ] ?? ""
                                                  ).trim() || null,
                                                departureTerminal:
                                                  (
                                                    tempDepartureTerminal[
                                                      week.weekNumber
                                                    ] ?? week.departureTerminal ?? ""
                                                  ).trim() || null,
                                                returnTerminal:
                                                  (
                                                    tempReturnTerminal[
                                                      week.weekNumber
                                                    ] ?? week.returnTerminal ?? ""
                                                  ).trim() || null,
                                                departureFlightDatetime:
                                                  tempDepartureDatetime[
                                                    week.weekNumber
                                                  ] || null,
                                                returnFlightDatetime:
                                                  tempReturnDatetime[
                                                    week.weekNumber
                                                  ] || null,
                                                departureLocator:
                                                  (
                                                    tempDepartureLocator[
                                                      week.weekNumber
                                                    ] ?? ""
                                                  ).trim() || null,
                                                returnLocator:
                                                  (
                                                    tempReturnLocator[
                                                      week.weekNumber
                                                    ] ?? ""
                                                  ).trim() || null,
                                                ticketType:
                                                  tempTicketType[
                                                    week.weekNumber
                                                  ] ?? "roundtrip",
                                                isTicketIssued:
                                                  week.isTicketIssued,
                                              },
                                              {
                                                onSuccess: () => {
                                                  utils.flights.getWeeks.invalidate({
                                                    year: selectedYear,
                                                  });
                                                  toast.success(
                                                    "Dados do bilhete salvos com sucesso!"
                                                  );
                                                  showTicketSaveSuccess(
                                                    week.weekNumber
                                                  );
                                                },
                                                onError: () =>
                                                  toast.error(
                                                    "Erro ao salvar dados do bilhete"
                                                  ),
                                                onSettled: () =>
                                                  setSavingTicket(prev => ({
                                                    ...prev,
                                                    [week.weekNumber]: false,
                                                  })),
                                              }
                                            );
                                          }}
                                        >
                                          {savingTicket[week.weekNumber] ? (
                                            <>
                                              <Loader2 className="w-4 h-4 animate-spin" />{" "}
                                              Salvando...
                                            </>
                                          ) : (
                                            savedTicket[week.weekNumber] ? (
                                              <>
                                                <CheckCircle2 className="w-4 h-4 text-emerald-300" />
                                                Dados salvos
                                              </>
                                            ) : (
                                              <>
                                                &#10003; Salvar Dados do Bilhete
                                              </>
                                            )
                                          )}
                                        </button>
                                        {savedTicket[week.weekNumber] && (
                                          <div
                                            role="status"
                                            aria-live="polite"
                                            className="flex items-center justify-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2 text-xs font-semibold text-emerald-800 animate-in fade-in slide-in-from-top-1 duration-200 motion-reduce:animate-none dark:border-emerald-800/70 dark:bg-emerald-950/40 dark:text-emerald-200"
                                          >
                                            <CheckCircle2 className="h-4 w-4 shrink-0" />
                                            Alterações da semana {week.weekNumber} registradas.
                                          </div>
                                        )}

                                        {/* Botões de Agenda — aparecem apenas quando há data salva */}
                                        {(week.departureFlightDatetime ||
                                          week.returnFlightDatetime) &&
                                          (() => {
                                            const buildEvent = (
                                              type: "ida" | "volta"
                                            ): CalendarEventParams | null => {
                                              const dt =
                                                type === "ida"
                                                  ? week.departureFlightDatetime
                                                  : week.returnFlightDatetime;
                                              if (!dt) return null;
                                              const airline =
                                                type === "ida"
                                                  ? week.departureAirline
                                                  : week.returnAirline;
                                              const flightNum =
                                                type === "ida"
                                                  ? week.departureFlightNumber
                                                  : week.returnFlightNumber;
                                              const airport =
                                                type === "ida"
                                                  ? week.departureAirport
                                                  : week.returnAirport;
                                              const airlineName = airline
                                                ? (airlineNames[airline] ??
                                                  airline.toUpperCase())
                                                : "Companhia";
                                              const airportName = airport
                                                ? (airportNames[airport] ??
                                                  airport)
                                                : "Aeroporto";
                                              const airportAddress = airport
                                                ? (airportAddresses[airport] ??
                                                  airportName)
                                                : airportName;
                                              const locator =
                                                type === "ida"
                                                  ? week.departureLocator
                                                  : week.returnLocator;
                                              const label =
                                                type === "ida"
                                                  ? "IDA"
                                                  : "VOLTA";
                                              // Aeroporto de destino: Ida vai para NVT, Volta vai para GRU/CGH
                                              const destAirport =
                                                type === "ida"
                                                  ? week.returnAirport || "NVT"
                                                  : week.departureAirport ||
                                                    "GRU";
                                              const trackUrl =
                                                airline && flightNum && airport
                                                  ? buildFlightTrackUrl(
                                                      airline,
                                                      flightNum,
                                                      airport,
                                                      destAirport,
                                                      dt
                                                    )
                                                  : null;
                                              return {
                                                title: `✈️ Voo ${label} ${flightNum ? flightNum : ""} — ${airlineName}`,
                                                flightDatetime: dt,
                                                location: airportAddress,
                                                description: [
                                                  `Voo: ${flightNum || "N/A"}`,
                                                  `Companhia: ${airlineName}`,
                                                  `Aeroporto: ${airportAddress}`,
                                                  locator
                                                    ? `Localizador: ${locator}`
                                                    : "",
                                                  `Semana ${week.weekNumber} — ${week.departureDate} a ${week.returnDate}`,
                                                  trackUrl
                                                    ? `Rastrear voo: ${trackUrl}`
                                                    : "",
                                                ]
                                                  .filter(Boolean)
                                                  .join("\n"),
                                              };
                                            };
                                            const depEvent = buildEvent("ida");
                                            const retEvent =
                                              buildEvent("volta");
                                            const allEvents = [
                                              depEvent,
                                              retEvent,
                                            ].filter(
                                              Boolean
                                            ) as CalendarEventParams[];
                                            if (allEvents.length === 0)
                                              return null;
                                            const currentLeadLabel =
                                              LEAD_OPTIONS.find(
                                                o =>
                                                  o.minutes ===
                                                  calendarLeadMinutes
                                              )?.label ?? "2h antes";
                                            return (
                                              <div className="border border-slate-200 rounded-xl overflow-hidden">
                                                {/* Cabeçalho com seletor de antecedência */}
                                                <div className="bg-slate-50 dark:bg-slate-700 px-3 py-2 flex items-center gap-2 border-b border-slate-200 dark:border-slate-600 flex-wrap">
                                                  <CalendarPlus className="w-3.5 h-3.5 text-slate-500 dark:text-slate-400 shrink-0" />
                                                  <span className="text-[11px] font-semibold text-slate-600 dark:text-slate-300 uppercase tracking-wide">
                                                    Adicionar à Agenda
                                                  </span>
                                                  <div className="ml-auto flex items-center gap-2 flex-wrap justify-end">
                                                    <div className="flex items-center gap-1">
                                                      <span className="text-[10px] text-slate-500">
                                                        Antecedência:
                                                      </span>
                                                      <select
                                                        value={
                                                          calendarLeadMinutes
                                                        }
                                                        onChange={e => {
                                                          const val = parseInt(
                                                            e.target.value,
                                                            10
                                                          );
                                                          setCalendarLeadMinutes(
                                                            val
                                                          );
                                                          localStorage.setItem(
                                                            "calendarLeadMinutes",
                                                            String(val)
                                                          );
                                                        }}
                                                        className="text-[11px] font-medium text-slate-700 dark:text-slate-100 bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-md px-1.5 py-0.5 focus:outline-none focus:ring-1 focus:ring-blue-400 dark:focus:ring-blue-500 cursor-pointer"
                                                      >
                                                        {LEAD_OPTIONS.map(
                                                          opt => (
                                                            <option
                                                              key={opt.minutes}
                                                              value={
                                                                opt.minutes
                                                              }
                                                            >
                                                              {opt.label}
                                                            </option>
                                                          )
                                                        )}
                                                      </select>
                                                    </div>
                                                    <div className="flex items-center gap-1">
                                                      <span className="text-[10px] text-slate-500">
                                                        Duração:
                                                      </span>
                                                      <select
                                                        value={
                                                          calendarDurationMinutes
                                                        }
                                                        onChange={e => {
                                                          const val = parseInt(
                                                            e.target.value,
                                                            10
                                                          );
                                                          setCalendarDurationMinutes(
                                                            val
                                                          );
                                                          localStorage.setItem(
                                                            "calendarDurationMinutes",
                                                            String(val)
                                                          );
                                                        }}
                                                        className="text-[11px] font-medium text-slate-700 dark:text-slate-100 bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-md px-1.5 py-0.5 focus:outline-none focus:ring-1 focus:ring-blue-400 dark:focus:ring-blue-500 cursor-pointer"
                                                      >
                                                        {DURATION_OPTIONS.map(
                                                          opt => (
                                                            <option
                                                              key={opt.minutes}
                                                              value={
                                                                opt.minutes
                                                              }
                                                            >
                                                              {opt.label}
                                                            </option>
                                                          )
                                                        )}
                                                      </select>
                                                    </div>
                                                  </div>
                                                </div>
                                                <div className="p-2 flex flex-col gap-1.5">
                                                  {/* Google Calendar */}
                                                  <div className="flex gap-1.5">
                                                    {depEvent && (
                                                      <a
                                                        href={getGoogleCalendarLink(
                                                          depEvent,
                                                          calendarLeadMinutes,
                                                          calendarDurationMinutes
                                                        )}
                                                        target="_blank"
                                                        rel="noopener noreferrer"
                                                        className="flex-1 flex items-center justify-center gap-1.5 py-1.5 px-2 rounded-lg bg-white border border-blue-200 hover:bg-blue-50 transition-colors text-[11px] font-medium text-blue-700"
                                                      >
                                                        <svg
                                                          className="w-3.5 h-3.5"
                                                          viewBox="0 0 24 24"
                                                          fill="none"
                                                        >
                                                          <rect
                                                            width="24"
                                                            height="24"
                                                            rx="4"
                                                            fill="#4285F4"
                                                          />
                                                          <path
                                                            d="M12 11v2h2.5c-.1.6-.8 1.8-2.5 1.8-1.5 0-2.8-1.2-2.8-2.8s1.2-2.8 2.8-2.8c.9 0 1.5.4 1.8.7l1.2-1.2C14.3 8.3 13.3 8 12 8c-2.2 0-4 1.8-4 4s1.8 4 4 4c2.3 0 3.8-1.6 3.8-3.9 0-.3 0-.5-.1-.7H12z"
                                                            fill="white"
                                                          />
                                                        </svg>
                                                        Google • Ida
                                                      </a>
                                                    )}
                                                    {retEvent && (
                                                      <a
                                                        href={getGoogleCalendarLink(
                                                          retEvent,
                                                          calendarLeadMinutes,
                                                          calendarDurationMinutes
                                                        )}
                                                        target="_blank"
                                                        rel="noopener noreferrer"
                                                        className="flex-1 flex items-center justify-center gap-1.5 py-1.5 px-2 rounded-lg bg-white border border-orange-200 hover:bg-orange-50 transition-colors text-[11px] font-medium text-orange-700"
                                                      >
                                                        <svg
                                                          className="w-3.5 h-3.5"
                                                          viewBox="0 0 24 24"
                                                          fill="none"
                                                        >
                                                          <rect
                                                            width="24"
                                                            height="24"
                                                            rx="4"
                                                            fill="#4285F4"
                                                          />
                                                          <path
                                                            d="M12 11v2h2.5c-.1.6-.8 1.8-2.5 1.8-1.5 0-2.8-1.2-2.8-2.8s1.2-2.8 2.8-2.8c.9 0 1.5.4 1.8.7l1.2-1.2C14.3 8.3 13.3 8 12 8c-2.2 0-4 1.8-4 4s1.8 4 4 4c2.3 0 3.8-1.6 3.8-3.9 0-.3 0-.5-.1-.7H12z"
                                                            fill="white"
                                                          />
                                                        </svg>
                                                        Google • Volta
                                                      </a>
                                                    )}
                                                  </div>
                                                  {/* Outlook */}
                                                  <div className="flex gap-1.5">
                                                    {depEvent && (
                                                      <a
                                                        href={getOutlookLink(
                                                          depEvent,
                                                          calendarLeadMinutes,
                                                          calendarDurationMinutes
                                                        )}
                                                        target="_blank"
                                                        rel="noopener noreferrer"
                                                        className="flex-1 flex items-center justify-center gap-1.5 py-1.5 px-2 rounded-lg bg-white border border-blue-200 hover:bg-blue-50 transition-colors text-[11px] font-medium text-blue-700"
                                                      >
                                                        <svg
                                                          className="w-3.5 h-3.5"
                                                          viewBox="0 0 24 24"
                                                          fill="none"
                                                        >
                                                          <rect
                                                            width="24"
                                                            height="24"
                                                            rx="4"
                                                            fill="#0078D4"
                                                          />
                                                          <path
                                                            d="M7 8h4v8H7V8zm5 0h5v3.5L15 13l-3-1.5V8zm0 5.5l3 1.5V18h-5v-3l2-1.5z"
                                                            fill="white"
                                                          />
                                                        </svg>
                                                        Outlook • Ida
                                                      </a>
                                                    )}
                                                    {retEvent && (
                                                      <a
                                                        href={getOutlookLink(
                                                          retEvent,
                                                          calendarLeadMinutes,
                                                          calendarDurationMinutes
                                                        )}
                                                        target="_blank"
                                                        rel="noopener noreferrer"
                                                        className="flex-1 flex items-center justify-center gap-1.5 py-1.5 px-2 rounded-lg bg-white border border-orange-200 hover:bg-orange-50 transition-colors text-[11px] font-medium text-orange-700"
                                                      >
                                                        <svg
                                                          className="w-3.5 h-3.5"
                                                          viewBox="0 0 24 24"
                                                          fill="none"
                                                        >
                                                          <rect
                                                            width="24"
                                                            height="24"
                                                            rx="4"
                                                            fill="#0078D4"
                                                          />
                                                          <path
                                                            d="M7 8h4v8H7V8zm5 0h5v3.5L15 13l-3-1.5V8zm0 5.5l3 1.5V18h-5v-3l2-1.5z"
                                                            fill="white"
                                                          />
                                                        </svg>
                                                        Outlook • Volta
                                                      </a>
                                                    )}
                                                  </div>
                                                  {/* Download .ics */}
                                                  <button
                                                    aria-label={`Baixar arquivo ICS para a semana ${week.weekNumber}`}
                                                    onClick={() =>
                                                      downloadICS(
                                                        allEvents,
                                                        `voo-semana-${week.weekNumber}.ics`,
                                                        calendarLeadMinutes,
                                                        calendarDurationMinutes
                                                      )
                                                    }
                                                    className="w-full flex items-center justify-center gap-1.5 py-1.5 px-2 rounded-lg bg-slate-100 hover:bg-slate-200 transition-colors text-[11px] font-medium text-slate-700 border border-slate-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-slate-500 focus-visible:ring-offset-1"
                                                  >
                                                    <Download className="w-3.5 h-3.5" />
                                                    Baixar .ics (Apple Calendar
                                                    / outros)
                                                  </button>

                                                  {/* Rastrear Voo */}
                                                  {(() => {
                                                    const depTrack =
                                                      week.departureAirline &&
                                                      week.departureFlightNumber &&
                                                      week.departureAirport &&
                                                      week.departureFlightDatetime
                                                        ? buildFlightTrackUrl(
                                                            week.departureAirline,
                                                            week.departureFlightNumber,
                                                            week.departureAirport,
                                                            week.returnAirport ||
                                                              "NVT",
                                                            week.departureFlightDatetime
                                                          )
                                                        : null;
                                                    const retTrack =
                                                      week.returnAirline &&
                                                      week.returnFlightNumber &&
                                                      week.returnAirport &&
                                                      week.returnFlightDatetime
                                                        ? buildFlightTrackUrl(
                                                            week.returnAirline,
                                                            week.returnFlightNumber,
                                                            week.returnAirport,
                                                            week.departureAirport ||
                                                              "GRU",
                                                            week.returnFlightDatetime
                                                          )
                                                        : null;
                                                    if (!depTrack && !retTrack)
                                                      return null;
                                                    return (
                                                      <>
                                                        <div className="flex items-center gap-1.5 pt-0.5">
                                                          <Radar className="w-3 h-3 text-slate-400 dark:text-slate-500" />
                                                          <span className="text-[10px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide">
                                                            Rastrear Voo
                                                          </span>
                                                        </div>
                                                        <div className="flex gap-1.5">
                                                          {depTrack && (
                                                            <a
                                                              href={depTrack}
                                                              target="_blank"
                                                              rel="noopener noreferrer"
                                                              className="flex-1 flex items-center justify-center gap-1.5 py-1.5 px-2 rounded-lg bg-blue-50 dark:bg-blue-900/30 border border-blue-200 dark:border-blue-700 hover:bg-blue-100 dark:hover:bg-blue-900/50 transition-colors text-[11px] font-semibold text-blue-700 dark:text-blue-300"
                                                            >
                                                              <Radar className="w-3.5 h-3.5" />
                                                              Rastrear Ida
                                                            </a>
                                                          )}
                                                          {retTrack && (
                                                            <a
                                                              href={retTrack}
                                                              target="_blank"
                                                              rel="noopener noreferrer"
                                                              className="flex-1 flex items-center justify-center gap-1.5 py-1.5 px-2 rounded-lg bg-green-50 dark:bg-green-900/30 border border-green-200 dark:border-green-700 hover:bg-green-100 dark:hover:bg-green-900/50 transition-colors text-[11px] font-semibold text-green-700 dark:text-green-300"
                                                            >
                                                              <Radar className="w-3.5 h-3.5" />
                                                              Rastrear Volta
                                                            </a>
                                                          )}
                                                        </div>
                                                      </>
                                                    );
                                                  })()}

                                                  {/* Compartilhar no WhatsApp */}
                                                  {(() => {
                                                    const depDt =
                                                      tempDepartureDatetime[
                                                        week.weekNumber
                                                      ] ||
                                                      week.departureFlightDatetime ||
                                                      "";
                                                    const retDt =
                                                      tempReturnDatetime[
                                                        week.weekNumber
                                                      ] ||
                                                      week.returnFlightDatetime ||
                                                      "";
                                                    const whatsappUrl =
                                                      buildWhatsAppShareUrl({
                                                        weekLabel: `Semana ${week.weekNumber} — ${week.departureDate} a ${week.returnDate}`,
                                                        departureDate: depDt
                                                          ? depDt.slice(0, 10)
                                                          : "",
                                                        departureTime: depDt
                                                          ? depDt.slice(11, 16)
                                                          : "",
                                                        departureAirport:
                                                          week.departureAirport ||
                                                          "GRU",
                                                        departureAirline:
                                                          week.departureAirline ||
                                                          "",
                                                        departureFlightNumber:
                                                          week.departureFlightNumber ||
                                                          "",
                                                        departureLocator:
                                                          tempDepartureLocator[
                                                            week.weekNumber
                                                          ] ??
                                                          week.departureLocator ??
                                                          "",
                                                        returnDate: retDt
                                                          ? retDt.slice(0, 10)
                                                          : "",
                                                        returnTime: retDt
                                                          ? retDt.slice(11, 16)
                                                          : "",
                                                        returnAirport:
                                                          week.returnAirport ||
                                                          "NVT",
                                                        returnAirline:
                                                          week.returnAirline ||
                                                          "",
                                                        returnFlightNumber:
                                                          week.returnFlightNumber ||
                                                          "",
                                                        returnLocator:
                                                          tempReturnLocator[
                                                            week.weekNumber
                                                          ] ??
                                                          week.returnLocator ??
                                                          "",
                                                      });
                                                    return (
                                                      <>
                                                        <div className="flex items-center gap-1.5 pt-0.5">
                                                          <svg
                                                            className="w-3 h-3 text-green-500 dark:text-green-400"
                                                            viewBox="0 0 24 24"
                                                            fill="currentColor"
                                                          >
                                                            <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z" />
                                                          </svg>
                                                          <span className="text-[10px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide">
                                                            Compartilhar
                                                          </span>
                                                        </div>
                                                        <a
                                                          href={whatsappUrl}
                                                          target="_blank"
                                                          rel="noopener noreferrer"
                                                          className="w-full flex items-center justify-center gap-2 py-2 px-3 rounded-lg bg-green-500 hover:bg-green-600 active:bg-green-700 dark:bg-green-600 dark:hover:bg-green-700 dark:active:bg-green-800 transition-colors text-[12px] font-bold text-white shadow-sm"
                                                        >
                                                          <svg
                                                            className="w-4 h-4"
                                                            viewBox="0 0 24 24"
                                                            fill="currentColor"
                                                          >
                                                            <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z" />
                                                          </svg>
                                                          Compartilhar no
                                                          WhatsApp
                                                        </a>
                                                        <ShareByEmailButton
                                                          weekNumber={
                                                            week.weekNumber
                                                          }
                                                          departureDate={
                                                            tempDepartureDatetime[
                                                              week.weekNumber
                                                            ]
                                                              ? tempDepartureDatetime[
                                                                  week
                                                                    .weekNumber
                                                                ].slice(0, 10)
                                                              : week.departureFlightDatetime
                                                                ? week.departureFlightDatetime.slice(
                                                                    0,
                                                                    10
                                                                  )
                                                                : ""
                                                          }
                                                          returnDate={
                                                            tempReturnDatetime[
                                                              week.weekNumber
                                                            ]
                                                              ? tempReturnDatetime[
                                                                  week
                                                                    .weekNumber
                                                                ].slice(0, 10)
                                                              : week.returnFlightDatetime
                                                                ? week.returnFlightDatetime.slice(
                                                                    0,
                                                                    10
                                                                  )
                                                                : ""
                                                          }
                                                          departureFlightNumber={
                                                            week.departureFlightNumber ||
                                                            ""
                                                          }
                                                          returnFlightNumber={
                                                            week.returnFlightNumber ||
                                                            ""
                                                          }
                                                          departureAirline={
                                                            week.departureAirline ||
                                                            ""
                                                          }
                                                          returnAirline={
                                                            week.returnAirline ||
                                                            ""
                                                          }
                                                          departurePNR={
                                                            tempDepartureLocator[
                                                              week.weekNumber
                                                            ] ??
                                                            week.departureLocator ??
                                                            ""
                                                          }
                                                          returnPNR={
                                                            tempReturnLocator[
                                                              week.weekNumber
                                                            ] ??
                                                            week.returnLocator ??
                                                            ""
                                                          }
                                                          departureDatetime={
                                                            tempDepartureDatetime[
                                                              week.weekNumber
                                                            ] ||
                                                            week.departureFlightDatetime ||
                                                            ""
                                                          }
                                                          returnDatetime={
                                                            tempReturnDatetime[
                                                              week.weekNumber
                                                            ] ||
                                                            week.returnFlightDatetime ||
                                                            ""
                                                          }
                                                          departureTerminal={
                                                            tempDepartureTerminal[
                                                              week.weekNumber
                                                            ] ??
                                                            week.departureTerminal ??
                                                            ""
                                                          }
                                                          returnTerminal={
                                                            tempReturnTerminal[
                                                              week.weekNumber
                                                            ] ??
                                                            week.returnTerminal ??
                                                            ""
                                                          }
                                                        />
                                                      </>
                                                    );
                                                  })()}
                                                </div>
                                              </div>
                                            );
                                          })()}
                                      </div>
                                    )}
                                  </div>
                                  {isAuthenticated && (
                                    <AdditionalFlightsPanel
                                      year={selectedYear}
                                      weekNumber={week.weekNumber}
                                      weekStartDate={week.departureDate}
                                      weekEndDate={week.returnDate}
                                      flights={additionalFlightsByWeek[week.weekNumber] ?? []}
                                      createRequestId={
                                        additionalFlightCreateRequest?.weekNumber ===
                                        week.weekNumber
                                          ? additionalFlightCreateRequest.requestId
                                          : null
                                      }
                                      onChanged={() =>
                                        Promise.all([
                                          utils.additionalFlights.getYear.invalidate({ year: selectedYear }),
                                          utils.flights.getWeeks.invalidate({ year: selectedYear }),
                                        ])
                                      }
                                    />
                                  )}
                                </div>
                              </Card>
                            );
                          })}
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                }
              )
            )}
          </div>
          </PassageManagementFrame>
        )}

        {/* Resumo */}
        {selectedWeeks.length > 0 && (
          <Card className="mt-8 p-6 border border-slate-200/60 shadow-xl shadow-slate-200/40 bg-white rounded-3xl">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div>
                <p className="text-sm text-slate-600 mb-1">
                  Viagens Selecionadas
                </p>
                <p className="text-3xl font-bold text-slate-900">
                  {selectedWeeks.length}
                </p>
              </div>
              <div>
                <p className="text-sm text-slate-600 mb-1">Bilhetes Emitidos</p>
                <p className="text-3xl font-bold text-blue-600">
                  {issuedCount}
                </p>
              </div>
              <div>
                <p className="text-sm text-slate-600 mb-1">Total em Dinheiro</p>
                <p className="text-3xl font-bold text-green-600">
                  {hideValues
                    ? "••••"
                    : `R$ ${totalCost.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
                </p>
              </div>
              {totalSmiles > 0 && (
                <div>
                  <p className="text-sm text-slate-600 mb-1">Total SMILES</p>
                  <p className="text-3xl font-bold text-orange-500">
                    {hideValues
                      ? "••••"
                      : `${totalSmiles.toLocaleString("pt-BR")} pts`}
                  </p>
                </div>
              )}
              {totalLatamPass > 0 && (
                <div>
                  <p className="text-sm text-slate-600 mb-1">
                    Total LATAM Pass
                  </p>
                  <p className="text-3xl font-bold text-red-600">
                    {hideValues
                      ? "••••"
                      : `${totalLatamPass.toLocaleString("pt-BR")} pts`}
                  </p>
                </div>
              )}
            </div>
          </Card>
        )}
          </div>
        )}

        {!isManagementView && (
          <>
        {/* Gráfico de Variação de Preços */}
        <Card
          id="price-chart-section"
          className={`mt-8 p-6 border rounded-3xl scroll-mt-4 transition-colors duration-300 ${
            theme === "dark"
              ? "border-slate-700/60 shadow-xl shadow-slate-900/40 bg-slate-800"
              : "border-slate-200/60 shadow-xl shadow-slate-200/40 bg-white"
          }`}
        >
          <button
            type="button"
            onClick={() => updateExpandablePanel("priceVariation")}
            aria-expanded={expandablePanels.priceVariation}
            aria-controls="price-variation-content"
            className="flex w-full items-start justify-between gap-3 rounded-2xl text-left focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 sm:items-center sm:gap-4"
          >
            <span className="flex min-w-0 items-center gap-3">
              <span
                className={`shrink-0 p-2 rounded-lg transition-colors duration-300 ${
                  theme === "dark" ? "bg-blue-900/40" : "bg-blue-100"
                }`}
              >
                <TrendingUp
                  className={`w-5 h-5 transition-colors duration-300 ${
                    theme === "dark" ? "text-blue-400" : "text-blue-600"
                  }`}
                />
              </span>
              <span className="min-w-0">
                <span
                  role="heading"
                  aria-level={2}
                  className={`block text-xl font-bold transition-colors duration-300 ${
                    theme === "dark" ? "text-slate-100" : "text-slate-900"
                  }`}
                >
                  Variação de Preços por Mês
                </span>
                <span
                  className={`block text-sm transition-colors duration-300 ${
                    theme === "dark" ? "text-slate-400" : "text-slate-500"
                  }`}
                >
                  Média dos preços registrados por todas as empresas e buscadores em cada mês
                </span>
              </span>
            </span>
            <span
              className={`flex shrink-0 items-center gap-1.5 text-sm font-semibold ${
                theme === "dark" ? "text-slate-300" : "text-slate-600"
              }`}
            >
              <span className="hidden sm:inline">
                {expandablePanels.priceVariation ? "Recolher" : "Expandir"}
              </span>
              {expandablePanels.priceVariation ? (
                <ChevronUp className="w-5 h-5" aria-hidden="true" />
              ) : (
                <ChevronDown className="w-5 h-5" aria-hidden="true" />
              )}
            </span>
          </button>

          {expandablePanels.priceVariation && (
            <div id="price-variation-content" className="mt-6">
          {/* Filtro de empresas do gráfico */}
          <div
            className={`mb-6 max-w-full overflow-hidden p-4 rounded-xl border transition-colors duration-300 ${
              theme === "dark"
                ? "bg-slate-700/50 border-slate-600"
                : "bg-slate-50 border-slate-200"
            }`}
          >
            <div className="mb-3 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
              <span
                className={`text-sm font-semibold transition-colors duration-300 ${
                  theme === "dark" ? "text-slate-300" : "text-slate-700"
                }`}
              >
                Filtrar Empresas no Gráfico
              </span>
              <div className="flex flex-wrap gap-1 sm:gap-2">
                <button
                  onClick={selectAllChartAirlines}
                  className="rounded px-2 py-1 text-xs font-medium text-[#0b2349] transition-colors hover:bg-[#e7edf6] hover:text-[#071a36] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#315c99]"
                  title="Selecionar todas as empresas"
                  aria-label="Selecionar todas as empresas"
                >
                  Selecionar todas
                </button>
                <span className="text-slate-300">|</span>
                <button
                  onClick={clearChartAirlines}
                  className="rounded px-2 py-1 text-xs font-medium text-slate-600 transition-colors hover:bg-slate-100 hover:text-[#071a36] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#315c99]"
                  title="Limpar seleção de empresas"
                  aria-label="Limpar seleção de empresas"
                >
                  Limpar
                </button>
              </div>
            </div>
            <div className="flex flex-wrap gap-2">
              {airlines.map(airline => {
                const isSelected = chartSelectedAirlines.has(airline.id);
                return (
                  <button
                    aria-label={`Filtrar por companhia ${airline.name}`}
                    key={airline.id}
                    onClick={() => toggleChartAirline(airline.id)}
                    aria-pressed={isSelected}
                    className={`flex items-center gap-2 rounded-full border-2 px-3 py-1.5 text-sm font-medium transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-[#315c99] focus-visible:ring-offset-2 ${
                      isSelected
                        ? "border-[#315c99] bg-[#071a36] text-white shadow-sm"
                        : "border-[#c8d6e9] bg-white text-[#0b2349] hover:border-[#315c99] hover:bg-[#f4f7fb] dark:border-slate-600 dark:bg-slate-900 dark:text-slate-100 dark:hover:border-[#315c99]"
                    }`}
                  >
                    <span>{airline.icon}</span>
                    {airline.name}
                    {isSelected && <span className="ml-1 opacity-80">✓</span>}
                  </button>
                );
              })}
            </div>
          </div>

          {!hasChartData ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <TrendingUp className="w-12 h-12 text-slate-200 mb-3" />
              <p className="text-slate-400 font-medium">
                Nenhum preço registrado ainda
              </p>
              <p className="text-slate-400 text-sm mt-1">
                Preencha os preços nas semanas acima para visualizar o gráfico
              </p>
            </div>
          ) : (
            shouldRenderDeferredCharts(hasChartData, isPriceChartVisible) ? (
              <Suspense fallback={<SkeletonChart />}>
                <PriceVariationCharts
                  data={chartData}
                  theme={theme}
                  hideValues={hideValues}
                  selectedAirlines={chartSelectedAirlines}
                />
              </Suspense>
            ) : (
              <button
                type="button"
                onClick={() => setIsPriceChartVisible(true)}
                className={`w-full flex flex-col items-center justify-center py-12 text-center rounded-xl border border-dashed transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 ${
                  theme === "dark"
                    ? "border-slate-600 text-slate-300 hover:bg-slate-700/50"
                    : "border-slate-300 text-slate-600 hover:bg-slate-50"
                }`}
              >
                <TrendingUp className="w-10 h-10 mb-3 text-blue-500" />
                <span className="font-medium">Carregar gráficos de preços</span>
                <span className="mt-1 text-sm opacity-80">
                  Os gráficos são carregados somente quando solicitados
                </span>
              </button>
            )
          )}
            </div>
          )}
        </Card>
          </>
        )}

        {isManagementView && (
          <>
        {/* Semanas Excluídas */}
        {deletedWeeks.length > 0 && (
          <Card className="mt-8 p-6 border border-red-100 shadow-sm bg-red-50/50 rounded-3xl">
            <h3 className="text-lg font-bold text-red-900 mb-4 flex items-center gap-2">
              <Trash2 className="w-5 h-5" /> Semanas Excluídas (
              {deletedWeeks.length})
            </h3>
            <div className="flex flex-wrap gap-2">
              {deletedWeeks.map(week => (
                <div
                  key={week.weekNumber}
                  className="flex items-center gap-2 bg-white border border-red-300 rounded-lg px-3 py-2"
                >
                  <span className="text-sm font-semibold text-red-900">
                    Semana {week.weekNumber}
                  </span>
                  <span className="text-xs text-red-600">
                    {week.departureDate}
                  </span>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleRestore(week.weekNumber)}
                    className="text-red-600 hover:text-red-700 h-auto p-0 ml-1"
                    title={`Restaurar semana ${week.weekNumber}`}
                    aria-label={`Restaurar semana ${week.weekNumber}`}
                  >
                    <RotateCcw className="w-4 h-4 mr-1" /> Restaurar
                  </Button>
                </div>
              ))}
            </div>
          </Card>
        )}
          </>
        )}
      </main>

      {/* Modal de Login */}
      <LoginModal open={showLoginModal} onOpenChange={setShowLoginModal} />
    </div>
  );
}
