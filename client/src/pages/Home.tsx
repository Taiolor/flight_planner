import { useState, useMemo, useEffect, useCallback, useRef } from 'react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend,
  LineChart, Line, ResponsiveContainer
} from 'recharts';
import { flightData, airlines, departureAirports, generateBookingLink, DepartureAirport, getFeriadosDaSemana, getFeriadosPorIntervalo, FeriadoInfo } from '@/lib/flightData';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { ChevronDown, Plane, Calendar, ExternalLink, AlertCircle, Trash2, CheckCircle2, Circle, Pencil, RotateCcw, Loader2, TrendingUp, Lock, LogOut, Eye, EyeOff, CalendarPlus, Download, Radar, RotateCw, Bell, BellOff, BellRing, Sparkles, Wand2 } from 'lucide-react';
import { getGoogleCalendarLink, getOutlookLink, downloadICS, airportNames, airportAddresses, airlineNames, airlineIataCodes, buildFlightTrackUrl, buildWhatsAppShareUrl, CalendarEventParams, LEAD_OPTIONS, DURATION_OPTIONS } from '@/lib/calendarHelper';
import { usePullToRefresh } from '@/hooks/usePullToRefresh';
import { usePushNotifications } from '@/hooks/usePushNotifications';
import { ExportPdfButton } from '@/components/FlightPdfExport';
import { NotificationSettingsPopup } from '@/components/NotificationSettingsPopup';
import { trpc } from '@/lib/trpc';
import { toast } from 'sonner';

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
  direction: 'departure' | 'return',
  allWeeks: WeekData[]
): string | null {
  if (!airline) return null;

  // Coletar todos os voos já salvos com número de voo preenchido
  const candidates = allWeeks
    .filter(w => {
      const a = direction === 'departure' ? w.departureAirline : w.returnAirline;
      const fn = direction === 'departure' ? w.departureFlightNumber : w.returnFlightNumber;
      return a === airline && fn && fn.trim();
    })
    .map(w => {
      const fn = (direction === 'departure' ? w.departureFlightNumber : w.returnFlightNumber) ?? '';
      const dt = direction === 'departure' ? w.departureFlightDatetime : w.returnFlightDatetime;
      return { flightNumber: fn.trim().toUpperCase(), datetime: dt ?? '' };
    });

  if (candidates.length === 0) return null;

  // Extrair dia da semana e hora do datetime fornecido
  let targetDow: number | null = null;
  let targetHour: number | null = null;
  if (datetime) {
    const d = new Date(datetime);
    if (!isNaN(d.getTime())) {
      targetDow = d.getDay(); // 0=Dom, 1=Seg, ..., 6=Sáb
      targetHour = d.getHours();
    }
  }

  // Função auxiliar: retorna o número de voo mais frequente em uma lista
  function mostFrequent(items: string[]): string | null {
    if (items.length === 0) return null;
    const freq: Record<string, number> = {};
    for (const item of items) freq[item] = (freq[item] ?? 0) + 1;
    return Object.entries(freq).sort((a, b) => b[1] - a[1])[0][0];
  }

  // Nível 1: mesmo dia da semana + faixa de horário (±1h)
  if (targetDow !== null && targetHour !== null) {
    const level1 = candidates.filter(c => {
      if (!c.datetime) return false;
      const d = new Date(c.datetime);
      if (isNaN(d.getTime())) return false;
      return d.getDay() === targetDow && Math.abs(d.getHours() - targetHour!) <= 1;
    });
    const result1 = mostFrequent(level1.map(c => c.flightNumber));
    if (result1) return result1;
  }

  // Nível 2: mesmo dia da semana
  if (targetDow !== null) {
    const level2 = candidates.filter(c => {
      if (!c.datetime) return false;
      const d = new Date(c.datetime);
      if (isNaN(d.getTime())) return false;
      return d.getDay() === targetDow;
    });
    const result2 = mostFrequent(level2.map(c => c.flightNumber));
    if (result2) return result2;
  }

  // Nível 3: qualquer voo da mesma companhia na mesma direção
  return mostFrequent(candidates.map(c => c.flightNumber));
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
}

interface PriceMap {
  [weekNumber: number]: { [airline: string]: string };
}

export default function Home() {
  // Auth state
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loginError, setLoginError] = useState('');

  const authCheckQuery = trpc.flightAuth.check.useQuery();
  const loginMutation = trpc.flightAuth.login.useMutation();
  const logoutAuthMutation = trpc.flightAuth.logout.useMutation();
  const authUtils = trpc.useUtils();

  const isAuthenticated = authCheckQuery.data?.authenticated ?? false;

  const handleLogin = () => {
    setLoginError('');
    loginMutation.mutate(
      { email: loginEmail, password: loginPassword },
      {
        onSuccess: () => {
          setShowLoginModal(false);
          setLoginEmail('');
          setLoginPassword('');
          authUtils.flightAuth.check.invalidate();
          toast.success('Login realizado com sucesso!');
        },
        onError: (err) => {
          setLoginError(err.message || 'E-mail ou senha incorretos.');
        },
      }
    );
  };

  const handleLogout = () => {
    logoutAuthMutation.mutate(undefined, {
      onSuccess: () => {
        authUtils.flightAuth.check.invalidate();
        toast.success('Sessão encerrada.');
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

  const [filterMonth, setFilterMonth] = useState<string>('all');
  const [filterAirline, setFilterAirline] = useState<string>('all');
  const [filterTicketStatus, setFilterTicketStatus] = useState<string>('all');
  // Estado para filtro de empresas no gráfico (todas selecionadas por padrão)
  const [chartSelectedAirlines, setChartSelectedAirlines] = useState<Set<string>>(
    () => new Set(airlines.map(a => a.id))
  );
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
  const selectAllChartAirlines = () => setChartSelectedAirlines(new Set(airlines.map(a => a.id)));
  const clearChartAirlines = () => setChartSelectedAirlines(new Set([airlines[0].id]));
  const [sortBy, setSortBy] = useState<string>('week');
  const [expandedWeek, setExpandedWeek] = useState<number | null>(null);
  const [departureAirport, setDepartureAirport] = useState<DepartureAirport>('GRU');
  const [showCheapestOnly, setShowCheapestOnly] = useState<boolean>(false);
  const [pricePercentile, setPricePercentile] = useState<number>(25);
  const [editingWeek, setEditingWeek] = useState<WeekData | null>(null);
  const [editDepartureDate, setEditDepartureDate] = useState('');
  const [editReturnDate, setEditReturnDate] = useState('');
  const [savingPrice, setSavingPrice] = useState<{ week: number; airline: string } | null>(null);

  // Estado para ocultar valores monetários (privacidade)
  const [hideValues, setHideValues] = useState<boolean>(() => {
    try { return localStorage.getItem('hideValues') === 'true'; } catch { return false; }
  });
  const toggleHideValues = () => {
    setHideValues(prev => {
      const next = !prev;
      try { localStorage.setItem('hideValues', String(next)); } catch {}
      return next;
    });
  };
  // Função helper para mascarar valores monetários
  const maskValue = (value: string | number) => hideValues ? '••••' : String(value);

  // Estados temporários unificados para todos os campos dos cards Ida/Volta
  const [tempDepartureDatetime, setTempDepartureDatetime] = useState<{ [weekNumber: number]: string }>({});
  const [tempReturnDatetime, setTempReturnDatetime] = useState<{ [weekNumber: number]: string }>({});
  const [tempDepartureLocator, setTempDepartureLocator] = useState<{ [weekNumber: number]: string }>({});
  const [tempReturnLocator, setTempReturnLocator] = useState<{ [weekNumber: number]: string }>({});
  const [tempDepartureFlightNumber, setTempDepartureFlightNumber] = useState<{ [weekNumber: number]: string }>({});
  const [tempReturnFlightNumber, setTempReturnFlightNumber] = useState<{ [weekNumber: number]: string }>({});
  const [tempDepartureAirport, setTempDepartureAirport] = useState<{ [weekNumber: number]: string }>({});
  const [tempReturnAirport, setTempReturnAirport] = useState<{ [weekNumber: number]: string }>({});
  const [tempDepartureAirline, setTempDepartureAirline] = useState<{ [weekNumber: number]: string }>({});
  const [tempReturnAirline, setTempReturnAirline] = useState<{ [weekNumber: number]: string }>({});
  // Controle de salvamento em andamento por semana
  const [savingTicket, setSavingTicket] = useState<{ [weekNumber: number]: boolean }>({});
  // Rastreia quais campos de número do voo foram preenchidos por sugestão automática
  // (e ainda não foram editados manualmente pelo usuário)
  const [suggestedDepartureFlightNumber, setSuggestedDepartureFlightNumber] = useState<{ [weekNumber: number]: boolean }>({});
  const [suggestedReturnFlightNumber, setSuggestedReturnFlightNumber] = useState<{ [weekNumber: number]: boolean }>({});
  // Antecedência configurável para eventos de calendário (persiste no dispositivo)
  const [calendarLeadMinutes, setCalendarLeadMinutes] = useState<number>(() => {
    const saved = localStorage.getItem('calendarLeadMinutes');
    return saved ? parseInt(saved, 10) : 120;
  });
  // Duração estimada do voo configurável (persiste no dispositivo)
  const [calendarDurationMinutes, setCalendarDurationMinutes] = useState<number>(() => {
    const saved = localStorage.getItem('calendarDurationMinutes');
    return saved ? parseInt(saved, 10) : 75;
  });

  // tRPC queries
  const weeksQuery = trpc.flights.getWeeks.useQuery();
  const pricesQuery = trpc.flights.getPrices.useQuery();
  const utils = trpc.useUtils();

  // Pull-to-refresh: puxar para baixo no topo da página para recarregar os dados
  const handleRefresh = useCallback(async () => {
    await Promise.all([
      utils.flights.getWeeks.invalidate(),
      utils.flights.getPrices.invalidate(),
    ]);
    toast.success('Dados atualizados!', { duration: 1500 });
  }, [utils]);

  const { pullDistance, isRefreshing, isPulling } = usePullToRefresh({
    threshold: 80,
    maxPull: 120,
    onRefresh: handleRefresh,
  });

  // Push Notifications
  const {
    status: pushStatus,
    isSubscribed: pushSubscribed,
    isLoading: pushLoading,
    subscribe: pushSubscribe,
    unsubscribe: pushUnsubscribe,
    sendTest: pushSendTest,
    isSendingTest: pushSendingTest,
  } = usePushNotifications();

  // Ref que rastreia quais semanas já foram inicializadas — evita sobrescrever
  // o que o usuário está digitando quando o tRPC faz refetch em background.
  const initializedWeeks = useRef<Set<number>>(new Set());

  // Sincronizar campos do banco para estado local.
  // Regra: campos de texto (localizador, número do voo, etc.) só são inicializados
  // UMA VEZ por semana para não sobrescrever o que o usuário está digitando.
  // Campos de data/hora são SEMPRE re-sincronizados com o banco para garantir que
  // valores já salvos sejam exibidos corretamente ao abrir o card.
  useEffect(() => {
    if (!weeksQuery.data) return;

    // Semanas novas (nunca inicializadas) — inicializar todos os campos
    const newWeeks = weeksQuery.data.filter(
      (w) => !initializedWeeks.current.has(w.weekNumber)
    );

    if (newWeeks.length > 0) {
      setTempDepartureLocator((prev) => {
        const next = { ...prev };
        newWeeks.forEach((w) => { next[w.weekNumber] = (w as any).departureLocator ?? ''; });
        return next;
      });
      setTempReturnLocator((prev) => {
        const next = { ...prev };
        newWeeks.forEach((w) => { next[w.weekNumber] = (w as any).returnLocator ?? ''; });
        return next;
      });
      setTempDepartureFlightNumber((prev) => {
        const next = { ...prev };
        newWeeks.forEach((w) => { next[w.weekNumber] = (w as any).departureFlightNumber ?? ''; });
        return next;
      });
      setTempReturnFlightNumber((prev) => {
        const next = { ...prev };
        newWeeks.forEach((w) => { next[w.weekNumber] = (w as any).returnFlightNumber ?? ''; });
        return next;
      });
      setTempDepartureAirport((prev) => {
        const next = { ...prev };
        newWeeks.forEach((w) => { next[w.weekNumber] = (w as any).departureAirport ?? ''; });
        return next;
      });
      setTempReturnAirport((prev) => {
        const next = { ...prev };
        newWeeks.forEach((w) => { next[w.weekNumber] = (w as any).returnAirport ?? ''; });
        return next;
      });
      setTempDepartureAirline((prev) => {
        const next = { ...prev };
        newWeeks.forEach((w) => { next[w.weekNumber] = (w as any).departureAirline ?? ''; });
        return next;
      });
      setTempReturnAirline((prev) => {
        const next = { ...prev };
        newWeeks.forEach((w) => { next[w.weekNumber] = (w as any).returnAirline ?? ''; });
        return next;
      });
      // Marcar estas semanas como inicializadas
      newWeeks.forEach((w) => initializedWeeks.current.add(w.weekNumber));
    }

    // Campos de data/hora: sempre re-sincronizar com o banco para TODAS as semanas
    // Isso garante que valores já salvos aparecem ao abrir o card, mesmo após refetch
    setTempDepartureDatetime((prev) => {
      const next = { ...prev };
      weeksQuery.data!.forEach((w) => {
        const saved = (w as any).departureFlightDatetime ?? '';
        if (saved) {
          // Valor já salvo no banco: usar como está (formato: YYYY-MM-DDTHH:mm)
          next[w.weekNumber] = saved;
        } else if (!(w.weekNumber in next) || !next[w.weekNumber]) {
          // Sem valor salvo e sem valor local: pré-preencher com a data de ida da semana
          const parts = w.departureDate.split('/');
          if (parts.length === 3) {
            next[w.weekNumber] = `${parts[2]}-${parts[1]}-${parts[0]}`;
          } else {
            next[w.weekNumber] = '';
          }
        }
        // Se já há valor local e não há valor no banco: manter o que o usuário digitou
      });
      return next;
    });
    setTempReturnDatetime((prev) => {
      const next = { ...prev };
      weeksQuery.data!.forEach((w) => {
        const saved = (w as any).returnFlightDatetime ?? '';
        if (saved) {
          // Valor já salvo no banco: usar como está (formato: YYYY-MM-DDTHH:mm)
          next[w.weekNumber] = saved;
        } else if (!(w.weekNumber in next) || !next[w.weekNumber]) {
          // Sem valor salvo e sem valor local: pré-preencher com a data de retorno da semana
          const parts = w.returnDate.split('/');
          if (parts.length === 3) {
            next[w.weekNumber] = `${parts[2]}-${parts[1]}-${parts[0]}`;
          } else {
            next[w.weekNumber] = '';
          }
        }
        // Se já há valor local e não há valor no banco: manter o que o usuário digitou
      });
      return next;
    });
  }, [weeksQuery.data]);
  const initWeeksMutation = trpc.flights.initWeeks.useMutation();
  const updateStatusMutation = trpc.flights.updateWeekStatus.useMutation();
  const updateDatesMutation = trpc.flights.updateWeekDates.useMutation();
  const savePriceMutation = trpc.flights.savePrice.useMutation();

  // Initialize weeks in DB if empty
  useEffect(() => {
    if (weeksQuery.data && weeksQuery.data.length === 0) {
      initWeeksMutation.mutate(
        flightData.map(f => ({
          weekNumber: f.semana,
          departureDate: f.ida.data,
          returnDate: f.retorno.data,
          departureDayOfWeek: f.ida.dia_semana,
          returnDayOfWeek: f.retorno.dia_semana,
          holiday: f.ida.feriado ?? null,
        })),
        {
          onSuccess: () => utils.flights.getWeeks.invalidate(),
        }
      );
    }
  }, [weeksQuery.data]);

  // Build price map from DB
  const priceMap: PriceMap = useMemo(() => {
    const map: PriceMap = {};
    if (pricesQuery.data) {
      for (const p of pricesQuery.data) {
        if (!map[p.weekNumber]) map[p.weekNumber] = {};
        map[p.weekNumber][p.airline] = p.price;
      }
    }
    return map;
  }, [pricesQuery.data]);

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
      }));
    }
    // Fallback to static data
    return flightData.map(f => ({
      weekNumber: f.semana,
      departureDate: f.ida.data,
      returnDate: f.retorno.data,
      departureDayOfWeek: f.ida.dia_semana,
      returnDayOfWeek: f.retorno.dia_semana,
      holiday: f.ida.feriado ?? null,
      isDeleted: 0,
      isTicketIssued: 0,
      isSelected: 0,
    }));
  }, [weeksQuery.data]);

  const getLowestPrice = useCallback((weekNumber: number): number | null => {
    const weekPrices = priceMap[weekNumber];
    if (!weekPrices) return null;
    const values = Object.values(weekPrices).map(p => parseFloat(p)).filter(p => !isNaN(p));
    return values.length > 0 ? Math.min(...values) : null;
  }, [priceMap]);

  // Calculate price percentile
  const priceThreshold = useMemo(() => {
    const allPrices: number[] = [];
    for (const weekPrices of Object.values(priceMap)) {
      for (const price of Object.values(weekPrices)) {
        const num = parseFloat(price as string);
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
      if (filterMonth !== 'all') {
        const month = w.departureDate.split('/')[1];
        if (month !== filterMonth) return false;
      }
      if (showCheapestOnly && priceThreshold) {
        const lowest = getLowestPrice(w.weekNumber);
        if (!lowest || lowest > priceThreshold) return false;
      }
      if (filterTicketStatus === 'issued' && !w.isTicketIssued) return false;
      if (filterTicketStatus === 'notIssued' && w.isTicketIssued) return false;
      return true;
    });
  }, [weeksData, filterMonth, showCheapestOnly, priceThreshold, filterTicketStatus, getLowestPrice]);

  const sortedWeeks = useMemo(() => {
    const sorted = [...filteredWeeks];
    if (sortBy === 'price') {
      sorted.sort((a, b) => {
        const pa = getLowestPrice(a.weekNumber) ?? Infinity;
        const pb = getLowestPrice(b.weekNumber) ?? Infinity;
        return pa - pb;
      });
    }
    return sorted;
  }, [filteredWeeks, sortBy, getLowestPrice]);

  const deletedWeeks = useMemo(() => weeksData.filter(w => w.isDeleted === 1), [weeksData]);

  // Agrupamento por mês
  const MONTH_NAMES: Record<string, string> = {
    '01': 'Janeiro', '02': 'Fevereiro', '03': 'Março', '04': 'Abril',
    '05': 'Maio', '06': 'Junho', '07': 'Julho', '08': 'Agosto',
    '09': 'Setembro', '10': 'Outubro', '11': 'Novembro', '12': 'Dezembro',
  };

  const weeksByMonth = useMemo(() => {
    const groups: { monthKey: string; monthLabel: string; weeks: WeekData[] }[] = [];
    const seen = new Set<string>();
    for (const week of sortedWeeks) {
      const monthKey = week.departureDate.split('/')[1];
      if (!seen.has(monthKey)) {
        seen.add(monthKey);
        groups.push({ monthKey, monthLabel: MONTH_NAMES[monthKey] || monthKey, weeks: [] });
      }
      groups.find(g => g.monthKey === monthKey)!.weeks.push(week);
    }
    return groups;
  }, [sortedWeeks]);

  // Mês corrente para iniciar expandido
  const currentMonthKey = useMemo(() => {
    const now = new Date();
    return String(now.getMonth() + 1).padStart(2, '0');
  }, []);

  const [expandedMonths, setExpandedMonths] = useState<Set<string>>(() => new Set([currentMonthKey]));

  const toggleMonth = (monthKey: string) => {
    setExpandedMonths(prev => {
      const next = new Set(prev);
      if (next.has(monthKey)) next.delete(monthKey);
      else next.add(monthKey);
      return next;
    });
  };
  const selectedWeeks = useMemo(() => weeksData.filter(w => w.isSelected === 1), [weeksData]);
  const issuedCount = useMemo(() => weeksData.filter(w => w.isSelected && w.isTicketIssued).length, [weeksData]);
  const totalCost = useMemo(() => {
    return weeksData
      .filter(w => w.isSelected)
      .reduce((sum, w) => sum + (getLowestPrice(w.weekNumber) ?? 0), 0);
  }, [weeksData, getLowestPrice]);

  // Dados para o gráfico de variação de preços por mês (todas as empresas)
  const chartData = useMemo(() => {
    const MONTHS = [
      { num: '03', label: 'Mar' }, { num: '04', label: 'Abr' }, { num: '05', label: 'Mai' },
      { num: '06', label: 'Jun' }, { num: '07', label: 'Jul' }, { num: '08', label: 'Ago' },
      { num: '09', label: 'Set' }, { num: '10', label: 'Out' }, { num: '11', label: 'Nov' },
      { num: '12', label: 'Dez' },
    ];
    return MONTHS.map(({ num, label }) => {
      const monthWeeks = weeksData.filter(w => {
        const parts = w.departureDate.split('/');
        return parts[1] === num && !w.isDeleted;
      });
      const entry: Record<string, string | number> = { mes: label };
      // Todas as empresas incluindo kayak e onhappy
      for (const airline of airlines) {
        const prices = monthWeeks
          .map(w => parseFloat(priceMap[w.weekNumber]?.[airline.id] || ''))
          .filter(p => !isNaN(p) && p > 0);
        if (prices.length > 0) {
          entry[airline.id] = Math.round(prices.reduce((a, b) => a + b, 0) / prices.length);
        }
      }
      // Menor preço geral do mês (considerando todas as empresas)
      const allPrices = monthWeeks
        .map(w => getLowestPrice(w.weekNumber))
        .filter((p): p is number => p !== null && p > 0);
      if (allPrices.length > 0) {
        entry['menor'] = Math.round(Math.min(...allPrices));
        entry['media'] = Math.round(allPrices.reduce((a, b) => a + b, 0) / allPrices.length);
      }
      return entry;
    });
  }, [weeksData, priceMap, getLowestPrice]);

  const hasChartData = chartData.some(d => Object.keys(d).length > 1);

  // Dados do resumo anual: total emitido por mês
  const annualSummaryData = useMemo(() => {
    const MONTHS = [
      { num: '03', label: 'Mar' }, { num: '04', label: 'Abr' }, { num: '05', label: 'Mai' },
      { num: '06', label: 'Jun' }, { num: '07', label: 'Jul' }, { num: '08', label: 'Ago' },
      { num: '09', label: 'Set' }, { num: '10', label: 'Out' }, { num: '11', label: 'Nov' },
      { num: '12', label: 'Dez' },
    ];
    return MONTHS.map(({ num, label }) => {
      const monthWeeks = weeksData.filter(w => {
        const parts = w.departureDate.split('/');
        return parts[1] === num && !w.isDeleted && w.isTicketIssued;
      });
      const total = monthWeeks.reduce((sum, w) => sum + (getLowestPrice(w.weekNumber) ?? 0), 0);
      return { mes: label, total: total > 0 ? Math.round(total * 100) / 100 : 0, count: monthWeeks.length };
    });
  }, [weeksData, getLowestPrice]);

  const annualTotalIssued = useMemo(() =>
    weeksData.filter(w => w.isTicketIssued && !w.isDeleted)
      .reduce((sum, w) => sum + (getLowestPrice(w.weekNumber) ?? 0), 0),
    [weeksData, getLowestPrice]
  );
  const annualIssuedCount = useMemo(() =>
    weeksData.filter(w => w.isTicketIssued && !w.isDeleted).length,
    [weeksData]
  );
  const annualHasData = annualSummaryData.some(d => d.total > 0);

  // Handlers
  const handleToggleSelect = (weekNumber: number, current: number) => {
    requireAuth(() => {
      updateStatusMutation.mutate(
        { weekNumber, isSelected: current ? 0 : 1 },
        { onSuccess: () => utils.flights.getWeeks.invalidate() }
      );
    });
  };

  const handleDelete = (weekNumber: number) => {
    requireAuth(() => {
      updateStatusMutation.mutate(
        { weekNumber, isDeleted: 1 },
        {
          onSuccess: () => {
            utils.flights.getWeeks.invalidate();
            toast.success(`Semana ${weekNumber} excluída`);
          }
        }
      );
    });
  };

  const handleRestore = (weekNumber: number) => {
    requireAuth(() => {
      updateStatusMutation.mutate(
        { weekNumber, isDeleted: 0 },
        {
          onSuccess: () => {
            utils.flights.getWeeks.invalidate();
            toast.success(`Semana ${weekNumber} restaurada`);
          }
        }
      );
    });
  };

  // Converte DD/MM/YYYY para YYYY-MM-DD (formato aceito pelo input datetime-local)
  const toInputDate = (dateStr: string): string => {
    const parts = dateStr.split('/');
    if (parts.length !== 3) return '';
    const [day, month, year] = parts;
    return `${year}-${month}-${day}`;
  };

  const handleToggleTicket = (weekNumber: number, current: number) => {
    requireAuth(() => {
      // Ao abrir o card (marcar como emitido), pré-preencher as datas da semana
      if (!current) {
        const week = weeksData.find(w => w.weekNumber === weekNumber);
        if (week) {
          const depDate = toInputDate(week.departureDate);
          const retDate = toInputDate(week.returnDate);

          // Para o campo de IDA: usar data+hora do banco se existir e tiver horário,
          // caso contrário usar a data da semana (sobrescreve qualquer valor anterior sem horário)
          const savedDep = week.departureFlightDatetime ?? '';
          const hasSavedDepTime = savedDep.includes('T') && savedDep.length > 10;
          setTempDepartureDatetime(prev => ({
            ...prev,
            [weekNumber]: hasSavedDepTime ? savedDep : depDate,
          }));

          // Para o campo de VOLTA: mesma lógica
          const savedRet = week.returnFlightDatetime ?? '';
          const hasSavedRetTime = savedRet.includes('T') && savedRet.length > 10;
          setTempReturnDatetime(prev => ({
            ...prev,
            [weekNumber]: hasSavedRetTime ? savedRet : retDate,
          }));
        }
      }

      updateStatusMutation.mutate(
        { weekNumber, isTicketIssued: current ? 0 : 1 },
        {
          onSuccess: () => {
            utils.flights.getWeeks.invalidate();
            toast.success(current ? 'Bilhete marcado como não emitido' : 'Bilhete marcado como emitido');
          }
        }
      );
    });
  };

  const handlePriceBlur = (weekNumber: number, airline: string, value: string) => {
    if (!isAuthenticated) {
      setShowLoginModal(true);
      return;
    }
    setSavingPrice({ week: weekNumber, airline });
    savePriceMutation.mutate(
      { weekNumber, airline, price: value },
      {
        onSuccess: () => {
          utils.flights.getPrices.invalidate();
          setSavingPrice(null);
        },
        onError: (err) => {
          setSavingPrice(null);
          if (err.message?.includes('login')) setShowLoginModal(true);
        },
      }
    );
  };

  const openEditModal = (week: WeekData) => {
    requireAuth(() => {
      setEditingWeek(week);
      // Convert DD/MM/YYYY to YYYY-MM-DD for date input
      const toInputDate = (d: string) => {
        const [day, month, year] = d.split('/');
        return `${year}-${month}-${day}`;
      };
      setEditDepartureDate(toInputDate(week.departureDate));
      setEditReturnDate(toInputDate(week.returnDate));
    });
  };

  const handleSaveDates = () => {
    if (!editingWeek) return;
    // Convert YYYY-MM-DD back to DD/MM/YYYY
    const toDisplayDate = (d: string) => {
      const [year, month, day] = d.split('-');
      return `${day}/${month}/${year}`;
    };
    const getDayOfWeek = (d: string) => {
      const [year, month, day] = d.split('-').map(Number);
      const date = new Date(year, month - 1, day);
      const days = ['Domingo', 'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado'];
      return days[date.getDay()];
    };

    updateDatesMutation.mutate(
      {
        weekNumber: editingWeek.weekNumber,
        departureDate: toDisplayDate(editDepartureDate),
        returnDate: toDisplayDate(editReturnDate),
        departureDayOfWeek: getDayOfWeek(editDepartureDate),
        returnDayOfWeek: getDayOfWeek(editReturnDate),
      },
      {
        onSuccess: () => {
          utils.flights.getWeeks.invalidate();
          setEditingWeek(null);
          toast.success('Datas atualizadas com sucesso!');
        },
        onError: () => toast.error('Erro ao salvar datas'),
      }
    );
  };

  const isLoading = weeksQuery.isLoading || pricesQuery.isLoading;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      {/* Pull-to-refresh indicator */}
      {(isPulling || isRefreshing) && (
        <div
          className="fixed top-0 left-0 right-0 z-[100] flex items-center justify-center transition-all duration-200"
          style={{
            height: isRefreshing ? '52px' : `${Math.max(pullDistance, 0)}px`,
            paddingTop: 'env(safe-area-inset-top)',
            background: 'linear-gradient(to bottom, #2563eb, #1d4ed8)',
            transform: isRefreshing ? 'translateY(0)' : undefined,
          }}
        >
          <div className="flex items-center gap-2 text-white">
            <RotateCw
              className={`w-5 h-5 ${isRefreshing ? 'animate-spin' : ''}`}
              style={{
                transform: !isRefreshing ? `rotate(${Math.min(pullDistance / 80 * 360, 360)}deg)` : undefined,
                transition: isRefreshing ? undefined : 'transform 0.05s linear',
              }}
            />
            {isRefreshing && <span className="text-sm font-medium">Atualizando...</span>}
            {!isRefreshing && pullDistance >= 80 && <span className="text-sm font-medium">Solte para atualizar</span>}
            {!isRefreshing && pullDistance < 80 && pullDistance > 20 && <span className="text-sm font-medium">Puxe para atualizar</span>}
          </div>
        </div>
      )}
      {/* Header */}
      <header
        className="bg-gradient-to-r from-blue-600 to-blue-700 text-white shadow-lg sticky top-0 z-50"
        style={{ paddingTop: 'env(safe-area-inset-top)' }}
      >
        <div className="container py-3 sm:py-6">
          <div className="flex items-center justify-between gap-2 flex-wrap">
            <div className="flex items-center gap-2 sm:gap-3">
              <div className="bg-white bg-opacity-20 p-2 sm:p-3 rounded-lg">
                <Plane className="w-5 h-5 sm:w-6 sm:h-6" />
              </div>
              <div>
                <h1 className="text-lg sm:text-3xl font-bold leading-tight">Smart Fly</h1>
                <p className="text-blue-100 text-xs sm:text-sm">{departureAirport} → NVT • 2026</p>
              </div>
            </div>
            <div className="flex items-center gap-2 sm:gap-3 flex-wrap">
              {/* Botão ocultar valores */}
              <Button
                size="sm"
                variant="outline"
                title={hideValues ? 'Exibir valores' : 'Ocultar valores'}
                className={`border-white text-white hover:bg-white hover:text-blue-700 ${
                  hideValues
                    ? 'bg-white/30 border-white/80'
                    : 'bg-white/10'
                }`}
                onClick={toggleHideValues}
              >
                {hideValues
                  ? <EyeOff className="w-4 h-4" />
                  : <Eye className="w-4 h-4" />}
              </Button>

              {/* Botão Configurar Avisos Push */}
              {pushStatus !== 'unsupported' && pushSubscribed && (
                <NotificationSettingsPopup
                  isAuthenticated={isAuthenticated}
                  onLoginRequired={() => setShowLoginModal(true)}
                />
              )}

              {/* Botão Ativar Notificações Push */}
              {pushStatus !== 'unsupported' && (
                <Button
                  size="sm"
                  variant="outline"
                  title={
                    pushStatus === 'denied'
                      ? 'Notificações bloqueadas pelo navegador'
                      : pushSubscribed
                      ? 'Notificações ativas — clique para desativar'
                      : 'Ativar notificações de voo'
                  }
                  disabled={pushLoading || pushStatus === 'denied'}
                  className={`border-white text-white hover:bg-white hover:text-blue-700 transition-all ${
                    pushSubscribed
                      ? 'bg-green-500/30 border-green-300'
                      : pushStatus === 'denied'
                      ? 'bg-red-500/20 border-red-300 opacity-60'
                      : 'bg-white/10'
                  }`}
                  onClick={async () => {
                    if (!isAuthenticated) { setShowLoginModal(true); return; }
                    if (pushSubscribed) {
                      await pushUnsubscribe();
                      toast.success('Notificações desativadas.');
                    } else {
                      await pushSubscribe();
                      if (pushStatus !== 'denied') {
                        toast.success('Notificações ativadas! Você será avisado 24h antes de cada voo.');
                      }
                    }
                  }}
                >
                  {pushLoading ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : pushStatus === 'denied' ? (
                    <BellOff className="w-4 h-4" />
                  ) : pushSubscribed ? (
                    <BellRing className="w-4 h-4" />
                  ) : (
                    <Bell className="w-4 h-4" />
                  )}
                  <span className="hidden sm:inline ml-1">
                    {pushStatus === 'denied'
                      ? 'Bloqueado'
                      : pushSubscribed
                      ? 'Notif. Ativas'
                      : 'Notificações'}
                  </span>
                </Button>
              )}


              <ExportPdfButton
                weeksData={weeksData}
                priceMap={priceMap}
                totalInvested={annualTotalIssued}
              />

              <Button
                size="sm"
                variant="outline"
                className="bg-white bg-opacity-10 border-white text-white hover:bg-white hover:text-blue-700"
                onClick={() => {
                  const el = document.getElementById('price-chart-section');
                  if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
                }}
              >
                <TrendingUp className="w-4 h-4 mr-1" /> Ver Gráfico
              </Button>
              {isAuthenticated ? (
                <div className="flex items-center gap-2">
                  <span className="text-xs text-green-300 flex items-center gap-1">
                    <CheckCircle2 className="w-3 h-3" /> {authCheckQuery.data?.email}
                  </span>
                  <Button
                    size="sm"
                    variant="outline"
                    className="bg-white bg-opacity-10 border-white text-white hover:bg-white hover:text-blue-700"
                    onClick={handleLogout}
                  >
                    <LogOut className="w-4 h-4 mr-1" /> Sair
                  </Button>
                </div>
              ) : (
                <Button
                  size="sm"
                  variant="outline"
                  className="bg-white bg-opacity-10 border-white text-white hover:bg-white hover:text-blue-700"
                  onClick={() => setShowLoginModal(true)}
                >
                  <Lock className="w-4 h-4 mr-1" /> Entrar
                </Button>
              )}
            </div>
          </div>
        </div>
      </header>

      <main className="container py-4 sm:py-8">
        {/* Resumo Anual */}
        <Card className="p-4 sm:p-6 mb-4 sm:mb-8 border-0 shadow-md bg-gradient-to-br from-blue-700 to-blue-900 text-white">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 mb-4 sm:mb-6">
            <div>
              <h2 className="text-xl sm:text-2xl font-bold text-white">Resumo Anual 2026</h2>
              <p className="text-blue-200 text-xs sm:text-sm mt-1">Passagens emitidas — GRU / CGH → NVT</p>
            </div>
            <div className="flex flex-wrap gap-3 sm:gap-6">
              <div className="text-center">
                <p className="text-blue-200 text-[10px] sm:text-xs uppercase tracking-wider mb-1">Bilhetes Emitidos</p>
                <p className="text-3xl sm:text-4xl font-black text-white">{annualIssuedCount}</p>
              </div>
              <div className="text-center">
                <p className="text-blue-200 text-[10px] sm:text-xs uppercase tracking-wider mb-1">Total Investido</p>
                <p className="text-2xl sm:text-4xl font-black text-emerald-300">
                  {hideValues ? '••••' : `R$ ${annualTotalIssued.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
                </p>
              </div>
              <div className="text-center">
                <p className="text-blue-200 text-[10px] sm:text-xs uppercase tracking-wider mb-1">Média por Viagem</p>
                <p className="text-2xl sm:text-4xl font-black text-amber-300">
                  {hideValues ? '••••' : annualIssuedCount > 0
                    ? `R$ ${(annualTotalIssued / annualIssuedCount).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
                    : '—'}
                </p>
              </div>
            </div>
          </div>
          {annualHasData ? (
            <div>
              <p className="text-blue-200 text-xs uppercase tracking-wider mb-3">Gasto por Mês (R$)</p>
              <ResponsiveContainer width="100%" height={160}>
                <BarChart data={annualSummaryData} margin={{ top: 0, right: 8, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
                  <XAxis dataKey="mes" tick={{ fill: '#bfdbfe', fontSize: 12 }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fill: '#bfdbfe', fontSize: 11 }} axisLine={false} tickLine={false}
                    tickFormatter={(v) => v > 0 ? `R$${(v/1000).toFixed(0)}k` : ''} />
                  <Tooltip
                    contentStyle={{ background: '#1e3a5f', border: 'none', borderRadius: 8, color: '#fff' }}
                    formatter={(value: number) => [hideValues ? '••••' : `R$ ${value.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`, 'Total Emitido']}
                    labelStyle={{ color: '#93c5fd', fontWeight: 600 }}
                  />
                  <Bar dataKey="total" fill="#34d399" radius={[4, 4, 0, 0]} label={{
                    position: 'top',
                    fill: '#a7f3d0',
                    fontSize: 10,
                    formatter: (v: number) => v > 0 ? (hideValues ? '•••' : `R$${(v/1000).toFixed(1)}k`) : ''
                  }} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="flex items-center justify-center h-24 rounded-xl border border-blue-500 border-dashed">
              <p className="text-blue-300 text-sm">Marque bilhetes como emitidos e adicione preços para ver o gráfico anual</p>
            </div>
          )}
        </Card>

        {/* Filtros */}
        <Card className="p-4 sm:p-6 mb-4 sm:mb-8 border-0 shadow-md">
          <h2 className="text-base sm:text-xl font-bold text-slate-900 mb-3 sm:mb-6">Filtros e Controles</h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 sm:gap-4">
            <div>
              <label className="text-sm font-semibold text-slate-700 mb-2 block">Mês</label>
              <Select value={filterMonth} onValueChange={setFilterMonth}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos os meses</SelectItem>
                  {['01','02','03','04','05','06','07','08','09','10','11','12'].map((m, i) => (
                    <SelectItem key={m} value={m}>
                      {['Janeiro','Fevereiro','Março','Abril','Maio','Junho','Julho','Agosto','Setembro','Outubro','Novembro','Dezembro'][i]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="text-sm font-semibold text-slate-700 mb-2 block">Companhia</label>
              <Select value={filterAirline} onValueChange={setFilterAirline}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas as companhias</SelectItem>
                  {airlines.map(a => (
                    <SelectItem key={a.id} value={a.id}>{a.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="text-sm font-semibold text-slate-700 mb-2 block">Ordenar por</label>
              <Select value={sortBy} onValueChange={setSortBy}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="week">Semana</SelectItem>
                  <SelectItem value="price">Preço</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="text-sm font-semibold text-slate-700 mb-2 block">Filtro de Preço</label>
              <div className="flex items-center gap-2 mt-1">
                <Checkbox checked={showCheapestOnly} onCheckedChange={(c) => setShowCheapestOnly(c as boolean)} />
                <span className="text-sm text-slate-600">Apenas os mais baratos</span>
              </div>
            </div>

            <div>
              <label className="text-sm font-semibold text-slate-700 mb-2 block">Status do Bilhete</label>
              <Select value={filterTicketStatus} onValueChange={setFilterTicketStatus}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos</SelectItem>
                  <SelectItem value="issued">Emitidos</SelectItem>
                  <SelectItem value="notIssued">Não Emitidos</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <p className="text-sm font-semibold text-green-900">{sortedWeeks.length} viagens</p>
              <p className="text-xs text-green-700">{44 - deletedWeeks.length} semanas disponíveis</p>
              {showCheapestOnly && priceThreshold && (
                <p className="text-xs text-green-700 mt-1">Limite: {hideValues ? '••••' : `R$ ${priceThreshold.toFixed(2)}`}</p>
              )}
            </div>
          </div>

          {showCheapestOnly && (
            <div className="mt-6 pt-6 border-t border-slate-200">
              <label className="text-sm font-semibold text-slate-700 mb-3 block">
                Percentil de Preço: {pricePercentile}%
              </label>
              <input type="range" min="5" max="50" step="5" value={pricePercentile}
                onChange={(e) => setPricePercentile(parseInt(e.target.value))} className="w-full" />
              <p className="text-xs text-slate-500 mt-2">Ajuste para mostrar voos mais ou menos baratos</p>
            </div>
          )}
        </Card>

        {/* Avisos de filtros ativos */}
        {(showCheapestOnly || filterTicketStatus !== 'all') && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6 flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-semibold text-blue-900">Filtros Ativos</p>
              <p className="text-sm text-blue-700 mt-1">
                {showCheapestOnly && `Mostrando ${pricePercentile}% mais baratos`}
                {showCheapestOnly && filterTicketStatus !== 'all' && ' • '}
                {filterTicketStatus === 'issued' && 'Apenas bilhetes emitidos'}
                {filterTicketStatus === 'notIssued' && 'Apenas bilhetes não emitidos'}
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

        {/* Lista de Semanas agrupada por Mês */}
        {!isLoading && (
          <div className="space-y-3">
            {sortedWeeks.length === 0 ? (
              <Card className="p-12 text-center border-0 shadow-md">
                <Calendar className="w-12 h-12 text-slate-300 mx-auto mb-4" />
                <p className="text-slate-500 text-lg">Nenhuma semana encontrada com os filtros selecionados</p>
              </Card>
            ) : (
              weeksByMonth.map(({ monthKey, monthLabel, weeks: monthWeeks }) => {
                const isOpen = expandedMonths.has(monthKey);
                const monthIssued = monthWeeks.filter(w => w.isTicketIssued).length;
                const monthSelected = monthWeeks.filter(w => w.isSelected).length;
                const monthHasHoliday = monthWeeks.some(w => getFeriadosPorIntervalo(w.weekNumber, w.departureDate, w.returnDate).length > 0);
                const monthIssuedTotal = monthWeeks
                  .filter(w => w.isTicketIssued)
                  .reduce((sum, w) => sum + (getLowestPrice(w.weekNumber) ?? 0), 0);
                return (
                  <div key={monthKey} className="rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                    {/* Cabeçalho do Mês */}
                    <button
                      onClick={() => toggleMonth(monthKey)}
                      className={`w-full flex items-center justify-between px-3 sm:px-6 py-3 sm:py-4 transition-colors ${
                        isOpen ? 'bg-blue-600 text-white' : 'bg-white hover:bg-slate-50 text-slate-900'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <ChevronDown className={`w-5 h-5 transition-transform ${
                          isOpen ? 'rotate-180 text-white' : 'text-slate-500'
                        }`} />
                        <span className="text-sm sm:text-lg font-bold">{monthLabel} 2026</span>
                        {monthHasHoliday && (
                          <span className={`text-xs px-2 py-0.5 rounded-full font-semibold ${
                            isOpen ? 'bg-white/20 text-white' : 'bg-orange-100 text-orange-700'
                          }`}>
                            🎉 Feriado
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-1 sm:gap-4 text-xs sm:text-sm flex-wrap justify-end">
                        <span className={isOpen ? 'text-blue-100' : 'text-slate-500'}>
                          {monthWeeks.length} semana{monthWeeks.length !== 1 ? 's' : ''}
                        </span>
                        {monthSelected > 0 && (
                          <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${
                            isOpen ? 'bg-white/20 text-white' : 'bg-green-100 text-green-700'
                          }`}>
                            ✓ {monthSelected} selecionada{monthSelected !== 1 ? 's' : ''}
                          </span>
                        )}
                        {monthIssued > 0 && (
                          <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${
                            isOpen ? 'bg-white/20 text-white' : 'bg-blue-100 text-blue-700'
                          }`}>
                            ✓ {monthIssued} emitido{monthIssued !== 1 ? 's' : ''}
                          </span>
                        )}
                        {monthIssuedTotal > 0 && (
                          <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${
                            isOpen ? 'bg-white/30 text-white' : 'bg-emerald-100 text-emerald-700'
                          }`}>
                            {hideValues ? '••••' : `R$ ${monthIssuedTotal.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
                          </span>
                        )}
                      </div>
                    </button>

                    {/* Semanas do Mês */}
                    {isOpen && (
                      <div className="divide-y divide-slate-100">
                        {monthWeeks.map(week => {
                const lowestPrice = getLowestPrice(week.weekNumber);
                const isCheap = showCheapestOnly && priceThreshold && lowestPrice && lowestPrice <= priceThreshold;
                return (
                  <Card
                    key={week.weekNumber}
                    className={`p-3 sm:p-6 border-0 shadow-md transition-all hover:shadow-lg ${
                      week.isSelected ? 'ring-2 ring-green-500 bg-green-50' :
                      week.isTicketIssued ? 'bg-blue-50' : ''
                    } ${isCheap ? 'border-l-4 border-l-orange-400' : ''}`}
                  >
                    <div className="flex items-start justify-between gap-2 sm:gap-4 mb-3 sm:mb-4">
                      <div className="flex items-start gap-2 sm:gap-4 flex-1">
                        <Checkbox
                          checked={!!week.isSelected}
                          onCheckedChange={() => handleToggleSelect(week.weekNumber, week.isSelected)}
                          className="mt-1"
                        />
                        <div className="flex-1">
                          <div className="flex flex-wrap items-center gap-2 mb-2">
                            <h3 className="text-lg font-bold text-slate-900">Semana {week.weekNumber}</h3>
                            {week.holiday && (
                              <span className="text-xs bg-orange-100 text-orange-800 px-2 py-1 rounded">
                                🎉 {week.holiday}
                              </span>
                            )}
                            {lowestPrice && (
                              <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded font-semibold">
                                💰 {hideValues ? '••••' : `R$ ${lowestPrice.toFixed(2)}`}
                              </span>
                            )}
                            {week.isTicketIssued ? (
                              <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded flex items-center gap-1">
                                <CheckCircle2 className="w-3 h-3" /> Bilhete Emitido
                              </span>
                            ) : null}
                          </div>
                          {/* Datas com indicadores de feriado */}
                          {(() => {
                            const feriados = getFeriadosPorIntervalo(week.weekNumber, week.departureDate, week.returnDate);
                            const feriadoIda = feriados.filter(f => f.tipo === 'ida');
                            const feriadoRetorno = feriados.filter(f => f.tipo === 'retorno');
                            const feriadosIntervalo = feriados.filter(f => f.tipo === 'intervalo');
                            return (
                              <div className="space-y-1">
                                <p className="text-sm text-slate-600 flex items-center gap-1 flex-wrap">
                                  <Calendar className="w-4 h-4 flex-shrink-0" />
                                  <span className="font-medium">Ida:</span>
                                  <span>{week.departureDate} ({week.departureDayOfWeek})</span>
                                  {feriadoIda.map(f => (
                                    <span key={f.feriado.data} className={`text-xs px-2 py-0.5 rounded-full font-semibold ${
                                      f.feriado.tipo === 'nacional' ? 'bg-red-100 text-red-700' : 'bg-amber-100 text-amber-700'
                                    }`}>
                                      🎉 {f.feriado.nome}
                                    </span>
                                  ))}
                                </p>
                                <p className="text-sm text-slate-600 flex items-center gap-1 flex-wrap">
                                  <Calendar className="w-4 h-4 flex-shrink-0" />
                                  <span className="font-medium">Retorno:</span>
                                  <span>{week.returnDate} ({week.returnDayOfWeek})</span>
                                  {feriadoRetorno.map(f => (
                                    <span key={f.feriado.data} className={`text-xs px-2 py-0.5 rounded-full font-semibold ${
                                      f.feriado.tipo === 'nacional' ? 'bg-red-100 text-red-700' : 'bg-amber-100 text-amber-700'
                                    }`}>
                                      🎉 {f.feriado.nome}
                                    </span>
                                  ))}
                                </p>
                                {feriadosIntervalo.length > 0 && (
                                  <p className="text-xs text-slate-500 flex items-center gap-1 flex-wrap pl-5">
                                    <span className="text-orange-600 font-semibold">⚠️ Feriados no período:</span>
                                    {feriadosIntervalo.map(f => (
                                      <span key={f.feriado.data} className={`px-2 py-0.5 rounded-full ${
                                        f.feriado.tipo === 'nacional' ? 'bg-red-100 text-red-700' : 'bg-amber-100 text-amber-700'
                                      }`}>
                                        {f.feriado.data.slice(0,5)} – {f.feriado.nome}
                                      </span>
                                    ))}
                                  </p>
                                )}
                              </div>
                            );
                          })()}
                        </div>
                      </div>

                      <div className="flex items-center gap-2 flex-shrink-0">
                        {/* Editar datas */}
                        <Button variant="outline" size="sm" onClick={() => openEditModal(week)}
                          title="Editar datas">
                          <Pencil className="w-4 h-4" />
                        </Button>
                        {/* Status bilhete + companhias */}
                        <div className="flex items-center gap-2 flex-wrap">
                          <Button
                            variant="outline" size="sm"
                            onClick={() => handleToggleTicket(week.weekNumber, week.isTicketIssued)}
                            className={week.isTicketIssued ? 'bg-blue-100 border-blue-300 text-blue-700' : ''}
                          >
                            {week.isTicketIssued
                              ? <><CheckCircle2 className="w-4 h-4 mr-1" />Emitido</>
                              : <><Circle className="w-4 h-4 mr-1" />Não Emitido</>
                            }
                          </Button>

                        </div>
                        {/* Excluir */}
                        <Button variant="outline" size="sm"
                          onClick={() => handleDelete(week.weekNumber)}
                          className="text-red-600 hover:text-red-700 hover:bg-red-50">
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>

                    {/* Buscadores de preços + Cards Ida/Volta lado a lado */}
                    <div className="flex flex-col lg:flex-row gap-3 sm:gap-4 mt-2">
                      {/* Coluna esquerda: Buscadores de preços */}
                      <div className="lg:w-72 xl:w-80 flex-shrink-0">
                        <div className="rounded-xl border border-slate-200 bg-slate-50 overflow-hidden">
                          <div className="bg-slate-700 px-3 py-2 flex items-center gap-2">
                            <Plane className="w-3.5 h-3.5 text-white" />
                            <span className="text-xs font-bold text-white uppercase tracking-wider">{departureAirport} → NVT • Preços</span>
                          </div>
                          <div className="p-3 space-y-2">
                            {airlines.map(airline => {
                              const currentPrice = priceMap[week.weekNumber]?.[airline.id] || '';
                              const isSaving = savingPrice?.week === week.weekNumber && savingPrice?.airline === airline.id;
                              return (
                                <div key={airline.id} className="flex items-center gap-2">
                                  <span className={`${airline.color} text-white px-2 py-1 rounded text-xs font-semibold w-20 text-center flex-shrink-0`}>
                                    {airline.icon} {airline.name}
                                  </span>
                                  <div className="relative flex-1">
                                    {hideValues ? (
                                      <div className="h-8 rounded-md border border-input bg-muted flex items-center px-3 text-xs text-muted-foreground tracking-widest">••••</div>
                                    ) : (
                                    <Input
                                      type="number"
                                      placeholder="R$ 0,00"
                                      defaultValue={currentPrice}
                                      key={`${week.weekNumber}-${airline.id}-${currentPrice}`}
                                      onBlur={(e) => handlePriceBlur(week.weekNumber, airline.id, e.target.value)}
                                      className="h-8 text-xs"
                                    />
                                    )}
                                    {isSaving && (
                                      <Loader2 className="w-3.5 h-3.5 animate-spin absolute right-2 top-2 text-blue-500" />
                                    )}
                                  </div>
                                  <Button variant="outline" size="sm" className="h-8 w-8 p-0 flex-shrink-0" asChild>
                                    <a
                                      href={generateBookingLink(airline.id, week.departureDate, week.returnDate, week.departureDate, week.returnDate, departureAirport, 'NVT')}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      title={`Buscar na ${airline.name}`}
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
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">

                            {/* Card IDA */}
                            <div className="rounded-xl border border-blue-200 bg-gradient-to-br from-blue-50 to-indigo-50 overflow-hidden shadow-sm">
                              <div className="bg-blue-600 px-3 py-2 flex items-center gap-2">
                                <Plane className="w-3.5 h-3.5 text-white" />
                                <span className="text-xs font-bold text-white uppercase tracking-wider">Ida</span>
                              </div>
                              <div className="p-3 flex flex-col gap-2.5">
                                <div className="flex flex-col gap-1">
                                  <label className="text-[10px] font-semibold text-blue-600 uppercase tracking-wide">Aeroporto</label>
                                  <Select
                                    value={tempDepartureAirport[week.weekNumber] ?? ''}
                                    onValueChange={(val) => setTempDepartureAirport(prev => ({ ...prev, [week.weekNumber]: val }))}
                                  >
                                    <SelectTrigger className="h-8 text-xs bg-white border-blue-200 w-full">
                                      <SelectValue placeholder="Selecionar aeroporto" />
                                    </SelectTrigger>
                                    <SelectContent>
                                      <SelectItem value="GRU">🛫 Guarulhos (GRU)</SelectItem>
                                      <SelectItem value="CGH">🛫 Congonhas (CGH)</SelectItem>
                                      <SelectItem value="VCP">🛫 Viracopos (VCP)</SelectItem>
                                      <SelectItem value="NVT">🛬 Navegantes (NVT)</SelectItem>
                                      <SelectItem value="JOI">🛬 Joinville (JOI)</SelectItem>
                                    </SelectContent>
                                  </Select>
                                </div>
                                <div className="flex flex-col gap-1">
                                  <div className="flex items-center justify-between">
                                    <label className="text-[10px] font-semibold text-blue-600 uppercase tracking-wide">Companhia Aérea</label>
                                    {tempDepartureAirline[week.weekNumber] && (
                                      <button
                                        type="button"
                                        title="Copiar companhia para Volta"
                                        onClick={() => setTempReturnAirline(prev => ({ ...prev, [week.weekNumber]: tempDepartureAirline[week.weekNumber] }))}
                                        className="flex items-center gap-0.5 text-[10px] font-medium text-blue-500 hover:text-blue-700 bg-blue-50 hover:bg-blue-100 border border-blue-200 rounded px-1.5 py-0.5 transition-colors"
                                      >
                                        <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" /></svg>
                                        Copiar → Volta
                                      </button>
                                    )}
                                  </div>
                                  <Select
                                    value={tempDepartureAirline[week.weekNumber] ?? ''}
                                    onValueChange={(val) => {
                                      const prevAirline = tempDepartureAirline[week.weekNumber] ?? '';
                                      setTempDepartureAirline(prev => ({ ...prev, [week.weekNumber]: val }));
                                      // Atualizar localizador com a nova sigla IATA se:
                                      //   (a) estiver vazio, OU
                                      //   (b) contiver exatamente a sigla da companhia anterior (2 chars)
                                      const newIata = airlineIataCodes[val] ?? val.toUpperCase().slice(0, 2);
                                      const prevIata = airlineIataCodes[prevAirline] ?? prevAirline.toUpperCase().slice(0, 2);
                                      const currentLocator = (tempDepartureLocator[week.weekNumber] ?? '').trim();
                                      if (!currentLocator || currentLocator === prevIata) {
                                        setTempDepartureLocator(prev => ({ ...prev, [week.weekNumber]: newIata }));
                                      }
                                      // Sugerir número do voo baseado no histórico
                                      const suggestion = suggestFlightNumber(val, tempDepartureDatetime[week.weekNumber] ?? '', 'departure', weeksData);
                                      if (suggestion && !(tempDepartureFlightNumber[week.weekNumber] ?? '').trim()) {
                                        setTempDepartureFlightNumber(prev => ({ ...prev, [week.weekNumber]: suggestion }));
                                        setSuggestedDepartureFlightNumber(prev => ({ ...prev, [week.weekNumber]: true }));
                                      }
                                    }}
                                  >
                                    <SelectTrigger className="h-8 text-xs bg-white border-blue-200 w-full">
                                      <SelectValue placeholder="Selecionar companhia">
                                        {tempDepartureAirline[week.weekNumber] === 'latam' && <span className="flex items-center gap-1.5"><img src="https://d2xsxph8kpxj0f.cloudfront.net/310419663028456038/HQ655wm9a6bck22hJAwYRc/logo-latam_a13bb510.png" className="h-4 w-auto object-contain" alt="LATAM" />LATAM</span>}
                                        {tempDepartureAirline[week.weekNumber] === 'gol' && <span className="flex items-center gap-1.5"><img src="https://d2xsxph8kpxj0f.cloudfront.net/310419663028456038/HQ655wm9a6bck22hJAwYRc/logo-gol_c86ba55a.png" className="h-4 w-auto object-contain" alt="Gol" />Gol</span>}
                                        {tempDepartureAirline[week.weekNumber] === 'azul' && <span className="flex items-center gap-1.5"><img src="https://d2xsxph8kpxj0f.cloudfront.net/310419663028456038/HQ655wm9a6bck22hJAwYRc/logo-azul_e89c8b63.png" className="h-4 w-auto object-contain" alt="Azul" />Azul</span>}
                                        {!tempDepartureAirline[week.weekNumber] && <span className="text-slate-400">Selecionar companhia</span>}
                                      </SelectValue>
                                    </SelectTrigger>
                                    <SelectContent>
                                      <SelectItem value="latam"><span className="flex items-center gap-2"><img src="https://d2xsxph8kpxj0f.cloudfront.net/310419663028456038/HQ655wm9a6bck22hJAwYRc/logo-latam_a13bb510.png" className="h-5 w-auto object-contain" alt="LATAM" />LATAM</span></SelectItem>
                                      <SelectItem value="gol"><span className="flex items-center gap-2"><img src="https://d2xsxph8kpxj0f.cloudfront.net/310419663028456038/HQ655wm9a6bck22hJAwYRc/logo-gol_c86ba55a.png" className="h-5 w-auto object-contain" alt="Gol" />Gol</span></SelectItem>
                                      <SelectItem value="azul"><span className="flex items-center gap-2"><img src="https://d2xsxph8kpxj0f.cloudfront.net/310419663028456038/HQ655wm9a6bck22hJAwYRc/logo-azul_e89c8b63.png" className="h-5 w-auto object-contain" alt="Azul" />Azul</span></SelectItem>
                                    </SelectContent>
                                  </Select>
                                </div>
                                <div className="flex flex-col gap-1">
                                  <div className="flex items-center justify-between">
                                    <label className="text-[10px] font-semibold text-blue-600 uppercase tracking-wide">Número do Voo</label>
                                    {suggestedDepartureFlightNumber[week.weekNumber] && (
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
                                    type="text" maxLength={10} placeholder="Ex: LA3045"
                                    className={`h-8 text-xs rounded-md px-2 bg-white text-slate-700 uppercase font-mono focus:outline-none focus:ring-2 w-full transition-colors ${
                                      suggestedDepartureFlightNumber[week.weekNumber]
                                        ? 'border border-amber-300 focus:ring-amber-400'
                                        : 'border border-blue-200 focus:ring-blue-400'
                                    }`}
                                    value={tempDepartureFlightNumber[week.weekNumber] ?? ''}
                                    onChange={(e) => {
                                      setTempDepartureFlightNumber(prev => ({ ...prev, [week.weekNumber]: e.target.value.toUpperCase() }));
                                      // Ao editar manualmente, remover o indicador de sugestão
                                      setSuggestedDepartureFlightNumber(prev => ({ ...prev, [week.weekNumber]: false }));
                                    }}
                                  />
                                </div>
                                <div className="flex flex-col gap-1">
                                  <label className="text-[10px] font-semibold text-blue-600 uppercase tracking-wide">Data e Hora do Voo</label>
                                  <input
                                    type="datetime-local"
                                    className="h-8 text-xs border border-blue-200 rounded-md px-2 bg-white text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-400 w-full"
                                    value={tempDepartureDatetime[week.weekNumber] || (() => {
                                      // Fallback: usar valor do banco ou data da semana
                                      const saved = week.departureFlightDatetime ?? '';
                                      if (saved) return saved;
                                      const parts = week.departureDate.split('/');
                                      return parts.length === 3 ? `${parts[2]}-${parts[1]}-${parts[0]}` : '';
                                    })()}
                                    onChange={(e) => setTempDepartureDatetime(prev => ({ ...prev, [week.weekNumber]: e.target.value }))}
                                  />
                                  {tempDepartureDatetime[week.weekNumber] && (() => {
                                    // Suporta tanto 'YYYY-MM-DD' (só data) quanto 'YYYY-MM-DDTHH:mm' (data+hora)
                                    const raw = tempDepartureDatetime[week.weekNumber];
                                    const iso = raw.includes('T') ? raw : raw + 'T12:00';
                                    const d = new Date(iso);
                                    if (isNaN(d.getTime())) return null;
                                    const label = d.toLocaleDateString('pt-BR', { weekday: 'long' });
                                    return (
                                      <span className="text-[11px] font-semibold text-blue-700 bg-blue-100 px-2 py-0.5 rounded-md w-fit">
                                        {label.charAt(0).toUpperCase() + label.slice(1)}
                                      </span>
                                    );
                                  })()}
                                </div>
                                <div className="flex flex-col gap-1">
                                  <div className="flex items-center justify-between">
                                    <label className="text-[10px] font-semibold text-blue-600 uppercase tracking-wide">Localizador (PNR)</label>
                                    {(tempDepartureLocator[week.weekNumber] ?? '').trim() && (
                                      <button
                                        type="button"
                                        title="Copiar localizador para Volta"
                                        onClick={() => setTempReturnLocator(prev => ({ ...prev, [week.weekNumber]: tempDepartureLocator[week.weekNumber] }))}
                                        className="flex items-center gap-0.5 text-[10px] font-medium text-blue-500 hover:text-blue-700 bg-blue-50 hover:bg-blue-100 border border-blue-200 rounded px-1.5 py-0.5 transition-colors"
                                      >
                                        <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" /></svg>
                                        Copiar → Volta
                                      </button>
                                    )}
                                  </div>
                                  <input
                                    type="text" maxLength={20} placeholder="Ex: ABC123"
                                    className="h-8 text-xs border border-blue-200 rounded-md px-2 bg-white text-slate-700 uppercase font-mono focus:outline-none focus:ring-2 focus:ring-blue-400 w-full"
                                    value={tempDepartureLocator[week.weekNumber] ?? ''}
                                    onChange={(e) => setTempDepartureLocator(prev => ({ ...prev, [week.weekNumber]: e.target.value.toUpperCase() }))}
                                  />
                                </div>
                              </div>
                            </div>

                            {/* Card VOLTA */}
                            <div className="rounded-xl border border-orange-200 bg-gradient-to-br from-orange-50 to-amber-50 overflow-hidden shadow-sm">
                              <div className="bg-orange-500 px-3 py-2 flex items-center gap-2">
                                <Plane className="w-3.5 h-3.5 text-white rotate-180" />
                                <span className="text-xs font-bold text-white uppercase tracking-wider">Volta</span>
                              </div>
                              <div className="p-3 flex flex-col gap-2.5">
                                <div className="flex flex-col gap-1">
                                  <label className="text-[10px] font-semibold text-orange-600 uppercase tracking-wide">Aeroporto</label>
                                  <Select
                                    value={tempReturnAirport[week.weekNumber] ?? ''}
                                    onValueChange={(val) => setTempReturnAirport(prev => ({ ...prev, [week.weekNumber]: val }))}
                                  >
                                    <SelectTrigger className="h-8 text-xs bg-white border-orange-200 w-full">
                                      <SelectValue placeholder="Selecionar aeroporto" />
                                    </SelectTrigger>
                                    <SelectContent>
                                      <SelectItem value="GRU">🛫 Guarulhos (GRU)</SelectItem>
                                      <SelectItem value="CGH">🛫 Congonhas (CGH)</SelectItem>
                                      <SelectItem value="VCP">🛫 Viracopos (VCP)</SelectItem>
                                      <SelectItem value="NVT">🛬 Navegantes (NVT)</SelectItem>
                                      <SelectItem value="JOI">🛬 Joinville (JOI)</SelectItem>
                                    </SelectContent>
                                  </Select>
                                </div>
                                <div className="flex flex-col gap-1">
                                  <label className="text-[10px] font-semibold text-orange-600 uppercase tracking-wide">Companhia Aérea</label>
                                  <Select
                                    value={tempReturnAirline[week.weekNumber] ?? ''}
                                    onValueChange={(val) => {
                                      const prevAirline = tempReturnAirline[week.weekNumber] ?? '';
                                      setTempReturnAirline(prev => ({ ...prev, [week.weekNumber]: val }));
                                      // Atualizar localizador com a nova sigla IATA se:
                                      //   (a) estiver vazio, OU
                                      //   (b) contiver exatamente a sigla da companhia anterior (2 chars)
                                      const newIata = airlineIataCodes[val] ?? val.toUpperCase().slice(0, 2);
                                      const prevIata = airlineIataCodes[prevAirline] ?? prevAirline.toUpperCase().slice(0, 2);
                                      const currentLocator = (tempReturnLocator[week.weekNumber] ?? '').trim();
                                      if (!currentLocator || currentLocator === prevIata) {
                                        setTempReturnLocator(prev => ({ ...prev, [week.weekNumber]: newIata }));
                                      }
                                      // Sugerir número do voo baseado no histórico
                                      const suggestion = suggestFlightNumber(val, tempReturnDatetime[week.weekNumber] ?? '', 'return', weeksData);
                                      if (suggestion && !(tempReturnFlightNumber[week.weekNumber] ?? '').trim()) {
                                        setTempReturnFlightNumber(prev => ({ ...prev, [week.weekNumber]: suggestion }));
                                        setSuggestedReturnFlightNumber(prev => ({ ...prev, [week.weekNumber]: true }));
                                      }
                                    }}
                                  >
                                    <SelectTrigger className="h-8 text-xs bg-white border-orange-200 w-full">
                                      <SelectValue placeholder="Selecionar companhia">
                                        {tempReturnAirline[week.weekNumber] === 'latam' && <span className="flex items-center gap-1.5"><img src="https://d2xsxph8kpxj0f.cloudfront.net/310419663028456038/HQ655wm9a6bck22hJAwYRc/logo-latam_a13bb510.png" className="h-4 w-auto object-contain" alt="LATAM" />LATAM</span>}
                                        {tempReturnAirline[week.weekNumber] === 'gol' && <span className="flex items-center gap-1.5"><img src="https://d2xsxph8kpxj0f.cloudfront.net/310419663028456038/HQ655wm9a6bck22hJAwYRc/logo-gol_c86ba55a.png" className="h-4 w-auto object-contain" alt="Gol" />Gol</span>}
                                        {tempReturnAirline[week.weekNumber] === 'azul' && <span className="flex items-center gap-1.5"><img src="https://d2xsxph8kpxj0f.cloudfront.net/310419663028456038/HQ655wm9a6bck22hJAwYRc/logo-azul_e89c8b63.png" className="h-4 w-auto object-contain" alt="Azul" />Azul</span>}
                                        {!tempReturnAirline[week.weekNumber] && <span className="text-slate-400">Selecionar companhia</span>}
                                      </SelectValue>
                                    </SelectTrigger>
                                    <SelectContent>
                                      <SelectItem value="latam"><span className="flex items-center gap-2"><img src="https://d2xsxph8kpxj0f.cloudfront.net/310419663028456038/HQ655wm9a6bck22hJAwYRc/logo-latam_a13bb510.png" className="h-5 w-auto object-contain" alt="LATAM" />LATAM</span></SelectItem>
                                      <SelectItem value="gol"><span className="flex items-center gap-2"><img src="https://d2xsxph8kpxj0f.cloudfront.net/310419663028456038/HQ655wm9a6bck22hJAwYRc/logo-gol_c86ba55a.png" className="h-5 w-auto object-contain" alt="Gol" />Gol</span></SelectItem>
                                      <SelectItem value="azul"><span className="flex items-center gap-2"><img src="https://d2xsxph8kpxj0f.cloudfront.net/310419663028456038/HQ655wm9a6bck22hJAwYRc/logo-azul_e89c8b63.png" className="h-5 w-auto object-contain" alt="Azul" />Azul</span></SelectItem>
                                    </SelectContent>
                                  </Select>
                                </div>
                                <div className="flex flex-col gap-1">
                                  <div className="flex items-center justify-between">
                                    <label className="text-[10px] font-semibold text-orange-600 uppercase tracking-wide">Número do Voo</label>
                                    {suggestedReturnFlightNumber[week.weekNumber] && (
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
                                    type="text" maxLength={10} placeholder="Ex: G31234"
                                    className={`h-8 text-xs rounded-md px-2 bg-white text-slate-700 uppercase font-mono focus:outline-none focus:ring-2 w-full transition-colors ${
                                      suggestedReturnFlightNumber[week.weekNumber]
                                        ? 'border border-amber-300 focus:ring-amber-400'
                                        : 'border border-orange-200 focus:ring-orange-400'
                                    }`}
                                    value={tempReturnFlightNumber[week.weekNumber] ?? ''}
                                    onChange={(e) => {
                                      setTempReturnFlightNumber(prev => ({ ...prev, [week.weekNumber]: e.target.value.toUpperCase() }));
                                      // Ao editar manualmente, remover o indicador de sugestão
                                      setSuggestedReturnFlightNumber(prev => ({ ...prev, [week.weekNumber]: false }));
                                    }}
                                  />
                                </div>
                                <div className="flex flex-col gap-1">
                                  <label className="text-[10px] font-semibold text-orange-600 uppercase tracking-wide">Data e Hora do Voo</label>
                                  <input
                                    type="datetime-local"
                                    className="h-8 text-xs border border-orange-200 rounded-md px-2 bg-white text-slate-700 focus:outline-none focus:ring-2 focus:ring-orange-400 w-full"
                                    value={tempReturnDatetime[week.weekNumber] || (() => {
                                      // Fallback: usar valor do banco ou data da semana
                                      const saved = week.returnFlightDatetime ?? '';
                                      if (saved) return saved;
                                      const parts = week.returnDate.split('/');
                                      return parts.length === 3 ? `${parts[2]}-${parts[1]}-${parts[0]}` : '';
                                    })()}
                                    onChange={(e) => setTempReturnDatetime(prev => ({ ...prev, [week.weekNumber]: e.target.value }))}
                                  />
                                  {tempReturnDatetime[week.weekNumber] && (
                                    <span className="text-[11px] font-semibold text-orange-700 bg-orange-100 px-2 py-0.5 rounded-md w-fit">
                                      {(() => {
                                        // Suporta tanto 'YYYY-MM-DD' (só data) quanto 'YYYY-MM-DDTHH:mm' (data+hora)
                                        const raw = tempReturnDatetime[week.weekNumber];
                                        const iso = raw.includes('T') ? raw : raw + 'T12:00';
                                        const d = new Date(iso);
                                        if (isNaN(d.getTime())) return 'Data inválida';
                                        const label = d.toLocaleDateString('pt-BR', { weekday: 'long' });
                                        return label.charAt(0).toUpperCase() + label.slice(1);
                                      })()}
                                    </span>
                                  )}
                                </div>
                                <div className="flex flex-col gap-1">
                                  <label className="text-[10px] font-semibold text-orange-600 uppercase tracking-wide">Localizador (PNR)</label>
                                  <input
                                    type="text" maxLength={20} placeholder="Ex: XYZ456"
                                    className="h-8 text-xs border border-orange-200 rounded-md px-2 bg-white text-slate-700 uppercase font-mono focus:outline-none focus:ring-2 focus:ring-orange-400 w-full"
                                    value={tempReturnLocator[week.weekNumber] ?? ''}
                                    onChange={(e) => setTempReturnLocator(prev => ({ ...prev, [week.weekNumber]: e.target.value.toUpperCase() }))}
                                  />
                                </div>
                              </div>
                            </div>
                          </div>

                          {/* Botão único Salvar — persiste todos os campos de uma vez */}
                          <button
                            disabled={savingTicket[week.weekNumber]}
                            className="w-full py-2.5 rounded-xl bg-gradient-to-r from-blue-600 to-orange-500 text-white text-sm font-bold shadow hover:opacity-90 active:scale-95 transition-all flex items-center justify-center gap-2 disabled:opacity-60"
                            onClick={() => {
                              if (!isAuthenticated) { setShowLoginModal(true); return; }
                              setSavingTicket(prev => ({ ...prev, [week.weekNumber]: true }));
                              updateStatusMutation.mutate({
                                weekNumber: week.weekNumber,
                                departureAirport: tempDepartureAirport[week.weekNumber] || null,
                                returnAirport: tempReturnAirport[week.weekNumber] || null,
                                departureAirline: tempDepartureAirline[week.weekNumber] || null,
                                returnAirline: tempReturnAirline[week.weekNumber] || null,
                                departureFlightNumber: (tempDepartureFlightNumber[week.weekNumber] ?? '').trim() || null,
                                returnFlightNumber: (tempReturnFlightNumber[week.weekNumber] ?? '').trim() || null,
                                departureFlightDatetime: tempDepartureDatetime[week.weekNumber] || null,
                                returnFlightDatetime: tempReturnDatetime[week.weekNumber] || null,
                                departureLocator: (tempDepartureLocator[week.weekNumber] ?? '').trim() || null,
                                returnLocator: (tempReturnLocator[week.weekNumber] ?? '').trim() || null,
                              }, {
                                onSuccess: () => {
                                  utils.flights.getWeeks.invalidate();
                                  toast.success('Dados do bilhete salvos com sucesso!');
                                },
                                onError: () => toast.error('Erro ao salvar dados do bilhete'),
                                onSettled: () => setSavingTicket(prev => ({ ...prev, [week.weekNumber]: false })),
                              });
                            }}
                          >
                            {savingTicket[week.weekNumber]
                              ? <><Loader2 className="w-4 h-4 animate-spin" /> Salvando...</>
                              : <>&#10003; Salvar Dados do Bilhete</>}
                          </button>

                          {/* Botões de Agenda — aparecem apenas quando há data salva */}
                          {(week.departureFlightDatetime || week.returnFlightDatetime) && (() => {
                            const buildEvent = (type: 'ida' | 'volta'): CalendarEventParams | null => {
                              const dt = type === 'ida' ? week.departureFlightDatetime : week.returnFlightDatetime;
                              if (!dt) return null;
                              const airline = type === 'ida' ? week.departureAirline : week.returnAirline;
                              const flightNum = type === 'ida' ? week.departureFlightNumber : week.returnFlightNumber;
                              const airport = type === 'ida' ? week.departureAirport : week.returnAirport;
                              const airlineName = airline ? (airlineNames[airline] ?? airline.toUpperCase()) : 'Companhia';
                              const airportName = airport ? (airportNames[airport] ?? airport) : 'Aeroporto';
                              const airportAddress = airport ? (airportAddresses[airport] ?? airportName) : airportName;
                              const locator = type === 'ida' ? week.departureLocator : week.returnLocator;
                              const label = type === 'ida' ? 'IDA' : 'VOLTA';
                              // Aeroporto de destino: Ida vai para NVT, Volta vai para GRU/CGH
                              const destAirport = type === 'ida'
                                ? (week.returnAirport || 'NVT')
                                : (week.departureAirport || 'GRU');
                              const trackUrl = (airline && flightNum && airport)
                                ? buildFlightTrackUrl(airline, flightNum, airport, destAirport, dt)
                                : null;
                              return {
                                title: `✈️ Voo ${label} ${flightNum ? flightNum : ''} — ${airlineName}`,
                                flightDatetime: dt,
                                location: airportAddress,
                                description: [
                                  `Voo: ${flightNum || 'N/A'}`,
                                  `Companhia: ${airlineName}`,
                                  `Aeroporto: ${airportAddress}`,
                                  locator ? `Localizador: ${locator}` : '',
                                  `Semana ${week.weekNumber} — ${week.departureDate} a ${week.returnDate}`,
                                  trackUrl ? `Rastrear voo: ${trackUrl}` : '',
                                ].filter(Boolean).join('\n'),
                              };
                            };
                            const depEvent = buildEvent('ida');
                            const retEvent = buildEvent('volta');
                            const allEvents = [depEvent, retEvent].filter(Boolean) as CalendarEventParams[];
                            if (allEvents.length === 0) return null;
                            const currentLeadLabel = LEAD_OPTIONS.find(o => o.minutes === calendarLeadMinutes)?.label ?? '2h antes';
                            return (
                              <div className="border border-slate-200 rounded-xl overflow-hidden">
                                {/* Cabeçalho com seletor de antecedência */}
                                <div className="bg-slate-50 px-3 py-2 flex items-center gap-2 border-b border-slate-200 flex-wrap">
                                  <CalendarPlus className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                                  <span className="text-[11px] font-semibold text-slate-600 uppercase tracking-wide">Adicionar à Agenda</span>
                                  <div className="ml-auto flex items-center gap-2 flex-wrap justify-end">
                                    <div className="flex items-center gap-1">
                                      <span className="text-[10px] text-slate-500">Antecedência:</span>
                                      <select
                                        value={calendarLeadMinutes}
                                        onChange={e => {
                                          const val = parseInt(e.target.value, 10);
                                          setCalendarLeadMinutes(val);
                                          localStorage.setItem('calendarLeadMinutes', String(val));
                                        }}
                                        className="text-[11px] font-medium text-slate-700 bg-white border border-slate-300 rounded-md px-1.5 py-0.5 focus:outline-none focus:ring-1 focus:ring-blue-400 cursor-pointer"
                                      >
                                        {LEAD_OPTIONS.map(opt => (
                                          <option key={opt.minutes} value={opt.minutes}>{opt.label}</option>
                                        ))}
                                      </select>
                                    </div>
                                    <div className="flex items-center gap-1">
                                      <span className="text-[10px] text-slate-500">Duração:</span>
                                      <select
                                        value={calendarDurationMinutes}
                                        onChange={e => {
                                          const val = parseInt(e.target.value, 10);
                                          setCalendarDurationMinutes(val);
                                          localStorage.setItem('calendarDurationMinutes', String(val));
                                        }}
                                        className="text-[11px] font-medium text-slate-700 bg-white border border-slate-300 rounded-md px-1.5 py-0.5 focus:outline-none focus:ring-1 focus:ring-blue-400 cursor-pointer"
                                      >
                                        {DURATION_OPTIONS.map(opt => (
                                          <option key={opt.minutes} value={opt.minutes}>{opt.label}</option>
                                        ))}
                                      </select>
                                    </div>
                                  </div>
                                </div>
                                <div className="p-2 flex flex-col gap-1.5">
                                  {/* Google Calendar */}
                                  <div className="flex gap-1.5">
                                    {depEvent && (
                                      <a
                                        href={getGoogleCalendarLink(depEvent, calendarLeadMinutes, calendarDurationMinutes)}
                                        target="_blank" rel="noopener noreferrer"
                                        className="flex-1 flex items-center justify-center gap-1.5 py-1.5 px-2 rounded-lg bg-white border border-blue-200 hover:bg-blue-50 transition-colors text-[11px] font-medium text-blue-700"
                                      >
                                        <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none"><rect width="24" height="24" rx="4" fill="#4285F4"/><path d="M12 11v2h2.5c-.1.6-.8 1.8-2.5 1.8-1.5 0-2.8-1.2-2.8-2.8s1.2-2.8 2.8-2.8c.9 0 1.5.4 1.8.7l1.2-1.2C14.3 8.3 13.3 8 12 8c-2.2 0-4 1.8-4 4s1.8 4 4 4c2.3 0 3.8-1.6 3.8-3.9 0-.3 0-.5-.1-.7H12z" fill="white"/></svg>
                                        Google • Ida
                                      </a>
                                    )}
                                    {retEvent && (
                                      <a
                                        href={getGoogleCalendarLink(retEvent, calendarLeadMinutes, calendarDurationMinutes)}
                                        target="_blank" rel="noopener noreferrer"
                                        className="flex-1 flex items-center justify-center gap-1.5 py-1.5 px-2 rounded-lg bg-white border border-orange-200 hover:bg-orange-50 transition-colors text-[11px] font-medium text-orange-700"
                                      >
                                        <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none"><rect width="24" height="24" rx="4" fill="#4285F4"/><path d="M12 11v2h2.5c-.1.6-.8 1.8-2.5 1.8-1.5 0-2.8-1.2-2.8-2.8s1.2-2.8 2.8-2.8c.9 0 1.5.4 1.8.7l1.2-1.2C14.3 8.3 13.3 8 12 8c-2.2 0-4 1.8-4 4s1.8 4 4 4c2.3 0 3.8-1.6 3.8-3.9 0-.3 0-.5-.1-.7H12z" fill="white"/></svg>
                                        Google • Volta
                                      </a>
                                    )}
                                  </div>
                                  {/* Outlook */}
                                  <div className="flex gap-1.5">
                                    {depEvent && (
                                      <a
                                        href={getOutlookLink(depEvent, calendarLeadMinutes, calendarDurationMinutes)}
                                        target="_blank" rel="noopener noreferrer"
                                        className="flex-1 flex items-center justify-center gap-1.5 py-1.5 px-2 rounded-lg bg-white border border-blue-200 hover:bg-blue-50 transition-colors text-[11px] font-medium text-blue-700"
                                      >
                                        <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none"><rect width="24" height="24" rx="4" fill="#0078D4"/><path d="M7 8h4v8H7V8zm5 0h5v3.5L15 13l-3-1.5V8zm0 5.5l3 1.5V18h-5v-3l2-1.5z" fill="white"/></svg>
                                        Outlook • Ida
                                      </a>
                                    )}
                                    {retEvent && (
                                      <a
                                        href={getOutlookLink(retEvent, calendarLeadMinutes, calendarDurationMinutes)}
                                        target="_blank" rel="noopener noreferrer"
                                        className="flex-1 flex items-center justify-center gap-1.5 py-1.5 px-2 rounded-lg bg-white border border-orange-200 hover:bg-orange-50 transition-colors text-[11px] font-medium text-orange-700"
                                      >
                                        <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none"><rect width="24" height="24" rx="4" fill="#0078D4"/><path d="M7 8h4v8H7V8zm5 0h5v3.5L15 13l-3-1.5V8zm0 5.5l3 1.5V18h-5v-3l2-1.5z" fill="white"/></svg>
                                        Outlook • Volta
                                      </a>
                                    )}
                                  </div>
                                  {/* Download .ics */}
                                  <button
                                    onClick={() => downloadICS(allEvents, `voo-semana-${week.weekNumber}.ics`, calendarLeadMinutes, calendarDurationMinutes)}
                                    className="w-full flex items-center justify-center gap-1.5 py-1.5 px-2 rounded-lg bg-slate-100 hover:bg-slate-200 transition-colors text-[11px] font-medium text-slate-700 border border-slate-200"
                                  >
                                    <Download className="w-3.5 h-3.5" />
                                    Baixar .ics (Apple Calendar / outros)
                                  </button>

                                  {/* Rastrear Voo */}
                                  {(() => {
                                    const depTrack = (week.departureAirline && week.departureFlightNumber && week.departureAirport && week.departureFlightDatetime)
                                      ? buildFlightTrackUrl(week.departureAirline, week.departureFlightNumber, week.departureAirport, week.returnAirport || 'NVT', week.departureFlightDatetime)
                                      : null;
                                    const retTrack = (week.returnAirline && week.returnFlightNumber && week.returnAirport && week.returnFlightDatetime)
                                      ? buildFlightTrackUrl(week.returnAirline, week.returnFlightNumber, week.returnAirport, week.departureAirport || 'GRU', week.returnFlightDatetime)
                                      : null;
                                    if (!depTrack && !retTrack) return null;
                                    return (
                                      <>
                                        <div className="flex items-center gap-1.5 pt-0.5">
                                          <Radar className="w-3 h-3 text-slate-400" />
                                          <span className="text-[10px] font-semibold text-slate-500 uppercase tracking-wide">Rastrear Voo</span>
                                        </div>
                                        <div className="flex gap-1.5">
                                          {depTrack && (
                                            <a
                                              href={depTrack}
                                              target="_blank" rel="noopener noreferrer"
                                              className="flex-1 flex items-center justify-center gap-1.5 py-1.5 px-2 rounded-lg bg-blue-50 border border-blue-200 hover:bg-blue-100 transition-colors text-[11px] font-semibold text-blue-700"
                                            >
                                              <Radar className="w-3.5 h-3.5" />
                                              Rastrear Ida
                                            </a>
                                          )}
                                          {retTrack && (
                                            <a
                                              href={retTrack}
                                              target="_blank" rel="noopener noreferrer"
                                              className="flex-1 flex items-center justify-center gap-1.5 py-1.5 px-2 rounded-lg bg-orange-50 border border-orange-200 hover:bg-orange-100 transition-colors text-[11px] font-semibold text-orange-700"
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
                                    const depDt = tempDepartureDatetime[week.weekNumber] || week.departureFlightDatetime || '';
                                    const retDt = tempReturnDatetime[week.weekNumber] || week.returnFlightDatetime || '';
                                    const whatsappUrl = buildWhatsAppShareUrl({
                                      weekLabel: `Semana ${week.weekNumber} — ${week.departureDate} a ${week.returnDate}`,
                                      departureDate: depDt ? depDt.slice(0, 10) : '',
                                      departureTime: depDt ? depDt.slice(11, 16) : '',
                                      departureAirport: week.departureAirport || 'GRU',
                                      departureAirline: week.departureAirline || '',
                                      departureFlightNumber: week.departureFlightNumber || '',
                                      departureLocator: (tempDepartureLocator[week.weekNumber] ?? week.departureLocator ?? ''),
                                      returnDate: retDt ? retDt.slice(0, 10) : '',
                                      returnTime: retDt ? retDt.slice(11, 16) : '',
                                      returnAirport: week.returnAirport || 'NVT',
                                      returnAirline: week.returnAirline || '',
                                      returnFlightNumber: week.returnFlightNumber || '',
                                      returnLocator: (tempReturnLocator[week.weekNumber] ?? week.returnLocator ?? ''),
                                    });
                                    return (
                                      <>
                                        <div className="flex items-center gap-1.5 pt-0.5">
                                          <svg className="w-3 h-3 text-green-500" viewBox="0 0 24 24" fill="currentColor"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z"/></svg>
                                          <span className="text-[10px] font-semibold text-slate-500 uppercase tracking-wide">Compartilhar</span>
                                        </div>
                                        <a
                                          href={whatsappUrl}
                                          target="_blank"
                                          rel="noopener noreferrer"
                                          className="w-full flex items-center justify-center gap-2 py-2 px-3 rounded-lg bg-green-500 hover:bg-green-600 active:bg-green-700 transition-colors text-[12px] font-bold text-white shadow-sm"
                                        >
                                          <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z"/></svg>
                                          Compartilhar no WhatsApp
                                        </a>
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
                  </Card>
                );
              })}
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>
        )}

        {/* Resumo */}
        {selectedWeeks.length > 0 && (
          <Card className="mt-8 p-6 border-0 shadow-md bg-gradient-to-r from-green-50 to-emerald-50">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div>
                <p className="text-sm text-slate-600 mb-1">Viagens Selecionadas</p>
                <p className="text-3xl font-bold text-slate-900">{selectedWeeks.length}</p>
              </div>
              <div>
                <p className="text-sm text-slate-600 mb-1">Bilhetes Emitidos</p>
                <p className="text-3xl font-bold text-blue-600">{issuedCount}</p>
              </div>
              <div>
                <p className="text-sm text-slate-600 mb-1">Custo Total (Menor Preço)</p>
                <p className="text-3xl font-bold text-green-600">R$ {totalCost.toFixed(2)}</p>
              </div>
            </div>
          </Card>
        )}

        {/* Gráfico de Variação de Preços */}
        <Card id="price-chart-section" className="mt-8 p-6 border-0 shadow-md scroll-mt-4">
          <div className="flex items-center gap-3 mb-6">
            <div className="bg-blue-100 p-2 rounded-lg">
              <TrendingUp className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-slate-900">Variação de Preços por Mês</h2>
              <p className="text-sm text-slate-500">Média dos preços registrados por todas as empresas e buscadores em cada mês</p>
            </div>
          </div>

          {/* Filtro de empresas do gráfico - sempre visível */}
          <div className="mb-6 p-4 bg-slate-50 rounded-xl border border-slate-200">
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm font-semibold text-slate-700">Filtrar Empresas no Gráfico</span>
              <div className="flex gap-2">
                <button
                  onClick={selectAllChartAirlines}
                  className="text-xs text-blue-600 hover:text-blue-800 font-medium px-2 py-1 rounded hover:bg-blue-50 transition-colors"
                >
                  Selecionar todas
                </button>
                <span className="text-slate-300">|</span>
                <button
                  onClick={clearChartAirlines}
                  className="text-xs text-slate-500 hover:text-slate-700 font-medium px-2 py-1 rounded hover:bg-slate-100 transition-colors"
                >
                  Limpar
                </button>
              </div>
            </div>
            <div className="flex flex-wrap gap-2">
              {airlines.map(airline => {
                const colorMap: Record<string, string> = {
                  kayak: 'bg-red-500', latam: 'bg-blue-600', gol: 'bg-yellow-500',
                  azul: 'bg-sky-400', voepass: 'bg-purple-600', onhappy: 'bg-green-600',
                };
                const isSelected = chartSelectedAirlines.has(airline.id);
                return (
                  <button
                    key={airline.id}
                    onClick={() => toggleChartAirline(airline.id)}
                    className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-medium border-2 transition-all ${
                      isSelected
                        ? 'border-transparent text-white shadow-sm'
                        : 'border-slate-300 text-slate-500 bg-white hover:border-slate-400'
                    }`}
                    style={isSelected ? { backgroundColor: {
                      kayak: '#ef4444', latam: '#2563eb', gol: '#eab308',
                      azul: '#38bdf8', voepass: '#9333ea', onhappy: '#16a34a',
                    }[airline.id] } : {}}
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
              <p className="text-slate-400 font-medium">Nenhum preço registrado ainda</p>
              <p className="text-slate-400 text-sm mt-1">Preencha os preços nas semanas acima para visualizar o gráfico</p>
            </div>
          ) : (
            <div className="space-y-8">
              {/* Gráfico de Barras por Companhia */}
              <div>
                <h3 className="text-sm font-semibold text-slate-600 mb-4 uppercase tracking-wide">Preço Médio por Companhia (R$)</h3>
                <ResponsiveContainer width="100%" height={320}>
                  <BarChart data={chartData} margin={{ top: 5, right: 20, left: 10, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                    <XAxis dataKey="mes" tick={{ fontSize: 12, fill: '#64748b' }} />
                    <YAxis tick={{ fontSize: 12, fill: '#64748b' }} tickFormatter={(v) => hideValues ? '•••' : `R$${v}`} />
                    <Tooltip formatter={(value: number) => [hideValues ? '••••' : `R$ ${value.toFixed(2)}`, '']} />
                    <Legend />
                    {chartSelectedAirlines.has('kayak') && <Bar dataKey="kayak" name="Kayak" fill="#ef4444" radius={[4,4,0,0]} />}
                    {chartSelectedAirlines.has('latam') && <Bar dataKey="latam" name="LATAM" fill="#2563eb" radius={[4,4,0,0]} />}
                    {chartSelectedAirlines.has('gol') && <Bar dataKey="gol" name="Gol" fill="#eab308" radius={[4,4,0,0]} />}
                    {chartSelectedAirlines.has('azul') && <Bar dataKey="azul" name="Azul" fill="#38bdf8" radius={[4,4,0,0]} />}
                    {chartSelectedAirlines.has('voepass') && <Bar dataKey="voepass" name="Voepass" fill="#9333ea" radius={[4,4,0,0]} />}
                    {chartSelectedAirlines.has('onhappy') && <Bar dataKey="onhappy" name="Onhappy" fill="#16a34a" radius={[4,4,0,0]} />}
                  </BarChart>
                </ResponsiveContainer>
              </div>

              {/* Gráfico de Linha - Menor Preço e Média */}
              <div>
                <h3 className="text-sm font-semibold text-slate-600 mb-4 uppercase tracking-wide">Menor Preço vs. Preço Médio por Mês (R$)</h3>
                <ResponsiveContainer width="100%" height={260}>
                  <LineChart data={chartData} margin={{ top: 5, right: 20, left: 10, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                    <XAxis dataKey="mes" tick={{ fontSize: 12, fill: '#64748b' }} />
                    <YAxis tick={{ fontSize: 12, fill: '#64748b' }} tickFormatter={(v) => hideValues ? '•••' : `R$${v}`} />
                    <Tooltip formatter={(value: number) => [hideValues ? '••••' : `R$ ${value.toFixed(2)}`, '']} />
                    <Legend />
                    <Line
                      type="monotone" dataKey="menor" name="Menor Preço"
                      stroke="#16a34a" strokeWidth={2} dot={{ r: 5, fill: '#16a34a' }}
                      connectNulls
                    />
                    <Line
                      type="monotone" dataKey="media" name="Preço Médio"
                      stroke="#f97316" strokeWidth={2} strokeDasharray="5 5" dot={{ r: 4, fill: '#f97316' }}
                      connectNulls
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>
          )}
        </Card>

        {/* Semanas Excluídas */}
        {deletedWeeks.length > 0 && (
          <Card className="mt-8 p-6 border-0 shadow-md bg-red-50">
            <h3 className="text-lg font-bold text-red-900 mb-4 flex items-center gap-2">
              <Trash2 className="w-5 h-5" /> Semanas Excluídas ({deletedWeeks.length})
            </h3>
            <div className="flex flex-wrap gap-2">
              {deletedWeeks.map(week => (
                <div key={week.weekNumber} className="flex items-center gap-2 bg-white border border-red-300 rounded-lg px-3 py-2">
                  <span className="text-sm font-semibold text-red-900">Semana {week.weekNumber}</span>
                  <span className="text-xs text-red-600">{week.departureDate}</span>
                  <Button variant="ghost" size="sm"
                    onClick={() => handleRestore(week.weekNumber)}
                    className="text-red-600 hover:text-red-700 h-auto p-0 ml-1">
                    <RotateCcw className="w-4 h-4 mr-1" /> Restaurar
                  </Button>
                </div>
              ))}
            </div>
          </Card>
        )}
      </main>

      {/* Modal de Edição de Datas */}
      <Dialog open={!!editingWeek} onOpenChange={(open) => !open && setEditingWeek(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Editar Datas — Semana {editingWeek?.weekNumber}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <Label htmlFor="dep-date">Data de Ida (Domingo)</Label>
              <Input
                id="dep-date"
                type="date"
                value={editDepartureDate}
                onChange={(e) => setEditDepartureDate(e.target.value)}
                className="mt-1"
              />
            </div>
            <div>
              <Label htmlFor="ret-date">Data de Retorno (Quinta ou Sexta)</Label>
              <Input
                id="ret-date"
                type="date"
                value={editReturnDate}
                onChange={(e) => setEditReturnDate(e.target.value)}
                className="mt-1"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditingWeek(null)}>Cancelar</Button>
            <Button onClick={handleSaveDates} disabled={updateDatesMutation.isPending}>
              {updateDatesMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
              Salvar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Modal de Login */}
      <Dialog open={showLoginModal} onOpenChange={setShowLoginModal}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Lock className="w-5 h-5 text-blue-600" />
              Acesso Restrito
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <p className="text-sm text-slate-500">Faça login para editar preços, datas e status dos bilhetes.</p>
            {loginError && (
              <div className="bg-red-50 border border-red-200 text-red-700 rounded-lg px-4 py-2 text-sm flex items-center gap-2">
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                {loginError}
              </div>
            )}
            <div>
              <Label htmlFor="login-email">E-mail</Label>
              <Input
                id="login-email"
                type="email"
                placeholder="seu@email.com"
                value={loginEmail}
                onChange={(e) => setLoginEmail(e.target.value)}
                className="mt-1"
                onKeyDown={(e) => e.key === 'Enter' && handleLogin()}
              />
            </div>
            <div>
              <Label htmlFor="login-password">Senha</Label>
              <div className="relative mt-1">
                <Input
                  id="login-password"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="••••••••"
                  value={loginPassword}
                  onChange={(e) => setLoginPassword(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleLogin()}
                  className="pr-10"
                />
                <button
                  type="button"
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => { setShowLoginModal(false); setLoginError(''); }}>Cancelar</Button>
            <Button
              onClick={handleLogin}
              disabled={loginMutation.isPending || !loginEmail || !loginPassword}
              className="bg-blue-600 hover:bg-blue-700"
            >
              {loginMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Lock className="w-4 h-4 mr-2" />}
              Entrar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
