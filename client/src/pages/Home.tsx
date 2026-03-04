import { useState, useMemo, useEffect, useCallback } from 'react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend,
  LineChart, Line, ResponsiveContainer
} from 'recharts';
import { flightData, airlines, departureAirports, generateBookingLink, DepartureAirport } from '@/lib/flightData';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { ChevronDown, Plane, Calendar, ExternalLink, AlertCircle, Trash2, CheckCircle2, Circle, Pencil, RotateCcw, Loader2, TrendingUp } from 'lucide-react';
import { trpc } from '@/lib/trpc';
import { toast } from 'sonner';

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
}

interface PriceMap {
  [weekNumber: number]: { [airline: string]: string };
}

export default function Home() {
  const [filterMonth, setFilterMonth] = useState<string>('all');
  const [filterAirline, setFilterAirline] = useState<string>('all');
  const [filterTicketStatus, setFilterTicketStatus] = useState<string>('all');
  const [sortBy, setSortBy] = useState<string>('week');
  const [expandedWeek, setExpandedWeek] = useState<number | null>(null);
  const [departureAirport, setDepartureAirport] = useState<DepartureAirport>('GRU');
  const [showCheapestOnly, setShowCheapestOnly] = useState<boolean>(false);
  const [pricePercentile, setPricePercentile] = useState<number>(25);
  const [editingWeek, setEditingWeek] = useState<WeekData | null>(null);
  const [editDepartureDate, setEditDepartureDate] = useState('');
  const [editReturnDate, setEditReturnDate] = useState('');
  const [savingPrice, setSavingPrice] = useState<{ week: number; airline: string } | null>(null);

  // tRPC queries
  const weeksQuery = trpc.flights.getWeeks.useQuery();
  const pricesQuery = trpc.flights.getPrices.useQuery();
  const initWeeksMutation = trpc.flights.initWeeks.useMutation();
  const updateStatusMutation = trpc.flights.updateWeekStatus.useMutation();
  const updateDatesMutation = trpc.flights.updateWeekDates.useMutation();
  const savePriceMutation = trpc.flights.savePrice.useMutation();
  const utils = trpc.useUtils();

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
  const selectedWeeks = useMemo(() => weeksData.filter(w => w.isSelected === 1), [weeksData]);
  const issuedCount = useMemo(() => weeksData.filter(w => w.isSelected && w.isTicketIssued).length, [weeksData]);
  const totalCost = useMemo(() => {
    return weeksData
      .filter(w => w.isSelected)
      .reduce((sum, w) => sum + (getLowestPrice(w.weekNumber) ?? 0), 0);
  }, [weeksData, getLowestPrice]);

  // Dados para o gráfico de variação de preços por mês
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
      // Para cada companhia (exceto kayak), calcular o menor preço médio do mês
      const airlineIds = airlines.filter(a => a.id !== 'kayak').map(a => a.id);
      for (const airlineId of airlineIds) {
        const prices = monthWeeks
          .map(w => parseFloat(priceMap[w.weekNumber]?.[airlineId] || ''))
          .filter(p => !isNaN(p) && p > 0);
        if (prices.length > 0) {
          entry[airlineId] = Math.round(prices.reduce((a, b) => a + b, 0) / prices.length);
        }
      }
      // Menor preço geral do mês
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

  // Handlers
  const handleToggleSelect = (weekNumber: number, current: number) => {
    updateStatusMutation.mutate(
      { weekNumber, isSelected: current ? 0 : 1 },
      { onSuccess: () => utils.flights.getWeeks.invalidate() }
    );
  };

  const handleDelete = (weekNumber: number) => {
    updateStatusMutation.mutate(
      { weekNumber, isDeleted: 1 },
      {
        onSuccess: () => {
          utils.flights.getWeeks.invalidate();
          toast.success(`Semana ${weekNumber} excluída`);
        }
      }
    );
  };

  const handleRestore = (weekNumber: number) => {
    updateStatusMutation.mutate(
      { weekNumber, isDeleted: 0 },
      {
        onSuccess: () => {
          utils.flights.getWeeks.invalidate();
          toast.success(`Semana ${weekNumber} restaurada`);
        }
      }
    );
  };

  const handleToggleTicket = (weekNumber: number, current: number) => {
    updateStatusMutation.mutate(
      { weekNumber, isTicketIssued: current ? 0 : 1 },
      {
        onSuccess: () => {
          utils.flights.getWeeks.invalidate();
          toast.success(current ? 'Bilhete marcado como não emitido' : 'Bilhete marcado como emitido');
        }
      }
    );
  };

  const handlePriceBlur = (weekNumber: number, airline: string, value: string) => {
    setSavingPrice({ week: weekNumber, airline });
    savePriceMutation.mutate(
      { weekNumber, airline, price: value },
      {
        onSuccess: () => {
          utils.flights.getPrices.invalidate();
          setSavingPrice(null);
        },
        onError: () => setSavingPrice(null),
      }
    );
  };

  const openEditModal = (week: WeekData) => {
    setEditingWeek(week);
    // Convert DD/MM/YYYY to YYYY-MM-DD for date input
    const toInputDate = (d: string) => {
      const [day, month, year] = d.split('/');
      return `${year}-${month}-${day}`;
    };
    setEditDepartureDate(toInputDate(week.departureDate));
    setEditReturnDate(toInputDate(week.returnDate));
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
      {/* Header */}
      <header className="bg-gradient-to-r from-blue-600 to-blue-700 text-white shadow-lg">
        <div className="container py-6">
          <div className="flex items-center justify-between gap-4 flex-wrap">
            <div className="flex items-center gap-3">
              <div className="bg-white bg-opacity-20 p-3 rounded-lg">
                <Plane className="w-6 h-6" />
              </div>
              <div>
                <h1 className="text-3xl font-bold">Planejador de Passagens Aéreas</h1>
                <p className="text-blue-100">{departureAirport} → Navegantes (NVT) • 2026</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-sm text-blue-100">Aeroporto de Saída</span>
              <Select value={departureAirport} onValueChange={(v) => setDepartureAirport(v as DepartureAirport)}>
                <SelectTrigger className="w-44 bg-white bg-opacity-20 border-white text-white">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {departureAirports.map(a => (
                    <SelectItem key={a.value} value={a.value}>{a.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>
      </header>

      <main className="container py-8">
        {/* Filtros */}
        <Card className="p-6 mb-8 border-0 shadow-md">
          <h2 className="text-xl font-bold text-slate-900 mb-6">Filtros e Controles</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-4">
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
                <p className="text-xs text-green-700 mt-1">Limite: R$ {priceThreshold.toFixed(2)}</p>
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

        {/* Lista de Semanas */}
        {!isLoading && (
          <div className="space-y-4">
            {sortedWeeks.length === 0 ? (
              <Card className="p-12 text-center border-0 shadow-md">
                <Calendar className="w-12 h-12 text-slate-300 mx-auto mb-4" />
                <p className="text-slate-500 text-lg">Nenhuma semana encontrada com os filtros selecionados</p>
              </Card>
            ) : (
              sortedWeeks.map(week => {
                const lowestPrice = getLowestPrice(week.weekNumber);
                const isCheap = showCheapestOnly && priceThreshold && lowestPrice && lowestPrice <= priceThreshold;
                return (
                  <Card
                    key={week.weekNumber}
                    className={`p-6 border-0 shadow-md transition-all hover:shadow-lg ${
                      week.isSelected ? 'ring-2 ring-green-500 bg-green-50' :
                      week.isTicketIssued ? 'bg-blue-50' : ''
                    } ${isCheap ? 'border-l-4 border-l-orange-400' : ''}`}
                  >
                    <div className="flex items-start justify-between gap-4 mb-4">
                      <div className="flex items-start gap-4 flex-1">
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
                                💰 R$ {lowestPrice.toFixed(2)}
                              </span>
                            )}
                            {week.isTicketIssued ? (
                              <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded flex items-center gap-1">
                                <CheckCircle2 className="w-3 h-3" /> Bilhete Emitido
                              </span>
                            ) : null}
                          </div>
                          <p className="text-sm text-slate-600">
                            <Calendar className="w-4 h-4 inline mr-1" />
                            {week.departureDate} ({week.departureDayOfWeek}) → {week.returnDate} ({week.returnDayOfWeek})
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 flex-shrink-0">
                        {/* Editar datas */}
                        <Button variant="outline" size="sm" onClick={() => openEditModal(week)}
                          title="Editar datas">
                          <Pencil className="w-4 h-4" />
                        </Button>
                        {/* Status bilhete */}
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
                        {/* Excluir */}
                        <Button variant="outline" size="sm"
                          onClick={() => handleDelete(week.weekNumber)}
                          className="text-red-600 hover:text-red-700 hover:bg-red-50">
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>

                    {/* Expandir detalhes */}
                    <div
                      className="cursor-pointer"
                      onClick={() => setExpandedWeek(expandedWeek === week.weekNumber ? null : week.weekNumber)}
                    >
                      <div className="flex items-center justify-between p-3 bg-slate-100 rounded-lg hover:bg-slate-200">
                        <div className="flex items-center gap-3">
                          <Plane className="w-4 h-4 text-blue-600" />
                          <span className="text-sm font-semibold text-slate-700">
                            {departureAirport} → NVT • Ver preços e links
                          </span>
                        </div>
                        <ChevronDown className={`w-4 h-4 text-slate-600 transition-transform ${expandedWeek === week.weekNumber ? 'rotate-180' : ''}`} />
                      </div>

                      {expandedWeek === week.weekNumber && (
                        <div className="mt-4 space-y-3" onClick={e => e.stopPropagation()}>
                          {airlines.map(airline => {
                            const currentPrice = priceMap[week.weekNumber]?.[airline.id] || '';
                            const isSaving = savingPrice?.week === week.weekNumber && savingPrice?.airline === airline.id;
                            return (
                              <div key={airline.id} className="flex items-center gap-3">
                                <span className={`${airline.color} text-white px-3 py-1 rounded text-xs font-semibold min-w-[80px] text-center`}>
                                  {airline.icon} {airline.name}
                                </span>
                                <div className="relative flex-1">
                                  <Input
                                    type="number"
                                    placeholder="R$ 0,00"
                                    defaultValue={currentPrice}
                                    key={`${week.weekNumber}-${airline.id}-${currentPrice}`}
                                    onBlur={(e) => handlePriceBlur(week.weekNumber, airline.id, e.target.value)}
                                    className="flex-1"
                                  />
                                  {isSaving && (
                                    <Loader2 className="w-4 h-4 animate-spin absolute right-2 top-2 text-blue-500" />
                                  )}
                                </div>
                                <Button variant="outline" size="sm" asChild>
                                  <a
                                    href={generateBookingLink(airline.id, week.departureDate, week.returnDate, week.departureDate, week.returnDate, departureAirport, 'NVT')}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    title={`Buscar na ${airline.name}`}
                                  >
                                    <ExternalLink className="w-4 h-4" />
                                  </a>
                                </Button>
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  </Card>
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
        <Card className="mt-8 p-6 border-0 shadow-md">
          <div className="flex items-center gap-3 mb-6">
            <div className="bg-blue-100 p-2 rounded-lg">
              <TrendingUp className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-slate-900">Variação de Preços por Mês</h2>
              <p className="text-sm text-slate-500">Média dos preços registrados por companhia aérea em cada mês</p>
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
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={chartData} margin={{ top: 5, right: 20, left: 10, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                    <XAxis dataKey="mes" tick={{ fontSize: 12, fill: '#64748b' }} />
                    <YAxis tick={{ fontSize: 12, fill: '#64748b' }} tickFormatter={(v) => `R$${v}`} />
                    <Tooltip formatter={(value: number) => [`R$ ${value.toFixed(2)}`, '']} />
                    <Legend />
                    <Bar dataKey="latam" name="LATAM" fill="#2563eb" radius={[4,4,0,0]} />
                    <Bar dataKey="gol" name="Gol" fill="#eab308" radius={[4,4,0,0]} />
                    <Bar dataKey="azul" name="Azul" fill="#38bdf8" radius={[4,4,0,0]} />
                    <Bar dataKey="voepass" name="Voepass" fill="#9333ea" radius={[4,4,0,0]} />
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
                    <YAxis tick={{ fontSize: 12, fill: '#64748b' }} tickFormatter={(v) => `R$${v}`} />
                    <Tooltip formatter={(value: number) => [`R$ ${value.toFixed(2)}`, '']} />
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
    </div>
  );
}
