import { useState, useMemo } from 'react';
import { flightData, airlines, airports, departureAirports, generateBookingLink, DepartureAirport } from '@/lib/flightData';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { ChevronDown, Plane, MapPin, Calendar, DollarSign, ExternalLink, TrendingDown, AlertCircle, Trash2, CheckCircle2, Circle } from 'lucide-react';

/**
 * Modern Travel Dashboard - Planejador de Passagens Aéreas 2026
 * Design: Corporativo moderno com paleta Azul + Verde + Laranja
 * Foco: Clareza hierárquica, eficiência visual, comparação de preços
 */

interface PriceEntry {
  [key: string]: string; // airline: price
}

interface FlightPrices {
  [key: number]: PriceEntry; // week: prices
}

interface TicketStatus {
  [key: number]: boolean; // week: isIssued
}

export default function Home() {
  const [selectedWeeks, setSelectedWeeks] = useState<Set<number>>(new Set());
  const [deletedWeeks, setDeletedWeeks] = useState<Set<number>>(new Set());
  const [prices, setPrices] = useState<FlightPrices>({});
  const [ticketStatus, setTicketStatus] = useState<TicketStatus>({});
  const [filterMonth, setFilterMonth] = useState<string>('all');
  const [filterAirline, setFilterAirline] = useState<string>('all');
  const [filterTicketStatus, setFilterTicketStatus] = useState<string>('all'); // all, issued, notIssued
  const [sortBy, setSortBy] = useState<string>('week');
  const [expandedWeek, setExpandedWeek] = useState<number | null>(null);
  const [departureAirport, setDepartureAirport] = useState<DepartureAirport>('GRU');
  const [showCheapestOnly, setShowCheapestOnly] = useState<boolean>(false);
  const [pricePercentile, setPricePercentile] = useState<number>(25); // Top 25% cheapest

  const getLowestPrice = (week: number): number | null => {
    const weekPrices = prices[week];
    if (!weekPrices) return null;
    const values = Object.values(weekPrices).map(p => parseFloat(p)).filter(p => !isNaN(p));
    return values.length > 0 ? Math.min(...values) : null;
  };

  // Calcular percentil de preço
  const calculatePricePercentile = useMemo(() => {
    const allPrices: number[] = [];
    Object.values(prices).forEach((weekPrices: any) => {
      Object.values(weekPrices).forEach((price: any) => {
        const numPrice = parseFloat(price as string);
        if (!isNaN(numPrice)) allPrices.push(numPrice);
      });
    });
    
    if (allPrices.length === 0) return null;
    
    allPrices.sort((a, b) => a - b);
    const index = Math.floor((pricePercentile / 100) * allPrices.length);
    return allPrices[index] || null;
  }, [prices, pricePercentile]);

  // Filtrar dados baseado em mês, preço e status de bilhete
  const filteredFlights = useMemo(() => {
    return flightData.filter(flight => {
      // Excluir semanas deletadas
      if (deletedWeeks.has(flight.semana)) return false;
      
      // Filtro de mês
      if (filterMonth === 'all') {
        // continue
      } else {
        const month = flight.ida.data.split('/')[1];
        if (month !== filterMonth) return false;
      }
      
      // Filtro de preço
      if (showCheapestOnly && calculatePricePercentile) {
        const lowestPrice = getLowestPrice(flight.semana);
        if (!lowestPrice || lowestPrice > calculatePricePercentile) return false;
      }
      
      // Filtro de status de bilhete
      if (filterTicketStatus === 'issued') {
        if (!ticketStatus[flight.semana]) return false;
      } else if (filterTicketStatus === 'notIssued') {
        if (ticketStatus[flight.semana]) return false;
      }
      
      return true;
    });
  }, [filterMonth, showCheapestOnly, calculatePricePercentile, filterTicketStatus, ticketStatus, deletedWeeks]);

  // Ordenar dados
  const sortedFlights = useMemo(() => {
    const sorted = [...filteredFlights];
    if (sortBy === 'price') {
      sorted.sort((a, b) => {
        const priceA = Math.min(...Object.values(prices[a.semana] || {}).map(p => parseFloat(p) || Infinity));
        const priceB = Math.min(...Object.values(prices[b.semana] || {}).map(p => parseFloat(p) || Infinity));
        return priceA - priceB;
      });
    }
    return sorted;
  }, [filteredFlights, sortBy, prices]);

  const handleToggleWeek = (week: number) => {
    const newSelected = new Set(selectedWeeks);
    if (newSelected.has(week)) {
      newSelected.delete(week);
    } else {
      newSelected.add(week);
    }
    setSelectedWeeks(newSelected);
  };

  const handleDeleteWeek = (week: number) => {
    const newDeleted = new Set(deletedWeeks);
    newDeleted.add(week);
    setDeletedWeeks(newDeleted);
  };

  const handleRestoreWeek = (week: number) => {
    const newDeleted = new Set(deletedWeeks);
    newDeleted.delete(week);
    setDeletedWeeks(newDeleted);
  };

  const handleToggleTicketIssued = (week: number) => {
    setTicketStatus(prev => ({
      ...prev,
      [week]: !prev[week]
    }));
  };

  const handlePriceChange = (week: number, airline: string, value: string) => {
    setPrices(prev => ({
      ...prev,
      [week]: {
        ...prev[week],
        [airline]: value
      }
    }));
  };

  const totalCost = useMemo(() => {
    return Array.from(selectedWeeks).reduce((sum, week) => {
      const lowestPrice = getLowestPrice(week);
      return sum + (lowestPrice || 0);
    }, 0);
  }, [selectedWeeks, prices]);

  const issuedCount = useMemo(() => {
    return Array.from(selectedWeeks).filter(week => ticketStatus[week]).length;
  }, [selectedWeeks, ticketStatus]);

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
              <Select value={departureAirport} onValueChange={(value) => setDepartureAirport(value as DepartureAirport)}>
                <SelectTrigger className="w-40 bg-white bg-opacity-20 border-white text-white">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {departureAirports.map(airport => (
                    <SelectItem key={airport.value} value={airport.value}>
                      {airport.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container py-8">
        {/* Filtros e Controles */}
        <Card className="p-6 mb-8 border-0 shadow-md">
          <h2 className="text-xl font-bold text-slate-900 mb-6">Filtros e Controles</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-4">
            {/* Filtro de Mês */}
            <div>
              <label className="text-sm font-semibold text-slate-700 mb-2 block">Mês</label>
              <Select value={filterMonth} onValueChange={setFilterMonth}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos os meses</SelectItem>
                  <SelectItem value="01">Janeiro</SelectItem>
                  <SelectItem value="02">Fevereiro</SelectItem>
                  <SelectItem value="03">Março</SelectItem>
                  <SelectItem value="04">Abril</SelectItem>
                  <SelectItem value="05">Maio</SelectItem>
                  <SelectItem value="06">Junho</SelectItem>
                  <SelectItem value="07">Julho</SelectItem>
                  <SelectItem value="08">Agosto</SelectItem>
                  <SelectItem value="09">Setembro</SelectItem>
                  <SelectItem value="10">Outubro</SelectItem>
                  <SelectItem value="11">Novembro</SelectItem>
                  <SelectItem value="12">Dezembro</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Filtro de Companhia */}
            <div>
              <label className="text-sm font-semibold text-slate-700 mb-2 block">Companhia</label>
              <Select value={filterAirline} onValueChange={setFilterAirline}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas as companhias</SelectItem>
                  {airlines.map(airline => (
                    <SelectItem key={airline.id} value={airline.id}>
                      {airline.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Ordenar por */}
            <div>
              <label className="text-sm font-semibold text-slate-700 mb-2 block">Ordenar por</label>
              <Select value={sortBy} onValueChange={setSortBy}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="week">Semana</SelectItem>
                  <SelectItem value="price">Preço</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Filtro de Preço */}
            <div>
              <label className="text-sm font-semibold text-slate-700 mb-2 block">Filtro de Preço</label>
              <div className="flex items-center gap-2">
                <Checkbox 
                  checked={showCheapestOnly}
                  onCheckedChange={(checked) => setShowCheapestOnly(checked as boolean)}
                />
                <span className="text-sm text-slate-600">Mostrar apenas os mais baratos</span>
              </div>
            </div>

            {/* Filtro de Status de Bilhete */}
            <div>
              <label className="text-sm font-semibold text-slate-700 mb-2 block">Status do Bilhete</label>
              <Select value={filterTicketStatus} onValueChange={setFilterTicketStatus}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos</SelectItem>
                  <SelectItem value="issued">Emitidos</SelectItem>
                  <SelectItem value="notIssued">Não Emitidos</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Resumo */}
            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <p className="text-sm font-semibold text-green-900 mb-1">{sortedFlights.length} viagens</p>
              <p className="text-xs text-green-700">{44 - deletedWeeks.size} semanas disponíveis</p>
              {showCheapestOnly && calculatePricePercentile && (
                <p className="text-xs text-green-700 mt-1">Limite: R$ {calculatePricePercentile.toFixed(2)}</p>
              )}
            </div>
          </div>

          {/* Slider para Percentil de Preço */}
          {showCheapestOnly && (
            <div className="mt-6 pt-6 border-t border-slate-200">
              <label className="text-sm font-semibold text-slate-700 mb-3 block">Percentil de Preço: {pricePercentile}%</label>
              <input
                type="range"
                min="5"
                max="50"
                step="5"
                value={pricePercentile}
                onChange={(e) => setPricePercentile(parseInt(e.target.value))}
                className="w-full"
              />
              <p className="text-xs text-slate-500 mt-2">Ajuste para mostrar voos mais ou menos baratos</p>
            </div>
          )}
        </Card>

        {/* Aviso de Filtro Ativo */}
        {(showCheapestOnly || filterTicketStatus !== 'all') && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6 flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-semibold text-blue-900">Filtros Ativos</p>
              <p className="text-sm text-blue-700 mt-1">
                {showCheapestOnly && `Mostrando apenas voos no percentil ${pricePercentile}% mais baratos`}
                {showCheapestOnly && filterTicketStatus !== 'all' && ' • '}
                {filterTicketStatus === 'issued' && 'Mostrando apenas bilhetes emitidos'}
                {filterTicketStatus === 'notIssued' && 'Mostrando apenas bilhetes não emitidos'}
              </p>
            </div>
          </div>
        )}

        {/* Lista de Semanas */}
        <div className="space-y-4">
          {sortedFlights.length === 0 ? (
            <Card className="p-12 text-center border-0 shadow-md">
              <Calendar className="w-12 h-12 text-slate-300 mx-auto mb-4" />
              <p className="text-slate-500 text-lg">Nenhuma semana encontrada com os filtros selecionados</p>
            </Card>
          ) : (
            sortedFlights.map(flight => (
              <Card 
                key={flight.semana} 
                className={`p-6 border-0 shadow-md cursor-pointer transition-all hover:shadow-lg ${
                  selectedWeeks.has(flight.semana) ? 'ring-2 ring-green-500 bg-green-50' : ''
                } ${
                  ticketStatus[flight.semana] ? 'bg-blue-50' : ''
                }`}
              >
                <div className="flex items-start justify-between gap-4 mb-4">
                  <div className="flex items-start gap-4 flex-1">
                    <Checkbox 
                      checked={selectedWeeks.has(flight.semana)}
                      onCheckedChange={() => handleToggleWeek(flight.semana)}
                      className="mt-1"
                    />
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <h3 className="text-lg font-bold text-slate-900">Semana {flight.semana}</h3>
                        {flight.ida.feriado && (
                          <span className="text-xs bg-orange-100 text-orange-800 px-2 py-1 rounded">
                            🎉 {flight.ida.feriado}
                          </span>
                        )}
                        {getLowestPrice(flight.semana) && (
                          <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded font-semibold">
                            💰 R$ {getLowestPrice(flight.semana)?.toFixed(2)}
                          </span>
                        )}
                        {ticketStatus[flight.semana] && (
                          <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded flex items-center gap-1">
                            <CheckCircle2 className="w-3 h-3" /> Bilhete Emitido
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-slate-600">
                        <Calendar className="w-4 h-4 inline mr-1" />
                        {flight.ida.data} ({flight.ida.dia_semana}) → {flight.retorno.data} ({flight.retorno.dia_semana})
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleToggleTicketIssued(flight.semana)}
                      className={ticketStatus[flight.semana] ? 'bg-blue-100 border-blue-300' : ''}
                    >
                      {ticketStatus[flight.semana] ? (
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
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDeleteWeek(flight.semana)}
                      className="text-red-600 hover:text-red-700 hover:bg-red-50"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>

                {/* Detalhes da Semana */}
                <div 
                  className="cursor-pointer"
                  onClick={() => setExpandedWeek(expandedWeek === flight.semana ? null : flight.semana)}
                >
                  <div className="flex items-center justify-between p-3 bg-slate-100 rounded-lg hover:bg-slate-200">
                    <div className="flex items-center gap-3">
                      <Plane className="w-4 h-4 text-blue-600" />
                      <span className="text-sm font-semibold text-slate-700">
                        {departureAirport} → NVT
                      </span>
                    </div>
                    <ChevronDown className={`w-4 h-4 text-slate-600 transition-transform ${expandedWeek === flight.semana ? 'rotate-180' : ''}`} />
                  </div>

                  {expandedWeek === flight.semana && (
                    <div className="mt-4 space-y-4">
                      {/* Preços por Companhia */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {airlines.map(airline => (
                          <div key={airline.id} className="flex items-center gap-3">
                            <span className={`${airline.color} text-white px-3 py-1 rounded text-xs font-semibold`}>
                              {airline.icon} {airline.name}
                            </span>
                            <Input
                              type="number"
                              placeholder="R$ 0,00"
                              value={prices[flight.semana]?.[airline.id] || ''}
                              onChange={(e) => handlePriceChange(flight.semana, airline.id, e.target.value)}
                              className="flex-1"
                            />
                            <Button
                              variant="outline"
                              size="sm"
                              asChild
                            >
                              <a
                                href={generateBookingLink(airline.id, flight.ida.data, flight.retorno.data, flight.ida.data, flight.retorno.data, departureAirport, 'NVT')}
                                target="_blank"
                                rel="noopener noreferrer"
                              >
                                <ExternalLink className="w-4 h-4" />
                              </a>
                            </Button>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </Card>
            ))
          )}
        </div>

        {/* Resumo de Custo */}
        {selectedWeeks.size > 0 && (
          <Card className="mt-8 p-6 border-0 shadow-md bg-gradient-to-r from-green-50 to-emerald-50">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div>
                <p className="text-sm text-slate-600 mb-1">Viagens Selecionadas</p>
                <p className="text-3xl font-bold text-slate-900">{selectedWeeks.size}</p>
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

        {/* Semanas Deletadas */}
        {deletedWeeks.size > 0 && (
          <Card className="mt-8 p-6 border-0 shadow-md bg-red-50 border border-red-200">
            <h3 className="text-lg font-bold text-red-900 mb-4">Semanas Excluídas ({deletedWeeks.size})</h3>
            <div className="flex flex-wrap gap-2">
              {Array.from(deletedWeeks).sort((a, b) => a - b).map(week => (
                <div key={week} className="flex items-center gap-2 bg-white border border-red-300 rounded-lg px-3 py-2">
                  <span className="text-sm font-semibold text-red-900">Semana {week}</span>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleRestoreWeek(week)}
                    className="text-red-600 hover:text-red-700 h-auto p-0 ml-2"
                  >
                    Restaurar
                  </Button>
                </div>
              ))}
            </div>
          </Card>
        )}
      </main>
    </div>
  );
}
