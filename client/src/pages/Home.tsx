import { useState, useMemo } from 'react';
import { flightData, airlines, airports, generateBookingLink } from '@/lib/flightData';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { ChevronDown, Plane, MapPin, Calendar, DollarSign, ExternalLink, TrendingDown, AlertCircle } from 'lucide-react';

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

export default function Home() {
  const [selectedWeeks, setSelectedWeeks] = useState<Set<number>>(new Set());
  const [prices, setPrices] = useState<FlightPrices>({});
  const [filterMonth, setFilterMonth] = useState<string>('all');
  const [filterAirline, setFilterAirline] = useState<string>('all');
  const [sortBy, setSortBy] = useState<string>('week');
  const [expandedWeek, setExpandedWeek] = useState<number | null>(null);

  // Filtrar dados baseado em mês
  const filteredFlights = useMemo(() => {
    return flightData.filter(flight => {
      if (filterMonth === 'all') return true;
      const month = flight.ida.data.split('/')[1];
      return month === filterMonth;
    });
  }, [filterMonth]);

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
  }, [filteredFlights, prices, sortBy]);

  const toggleWeek = (week: number) => {
    const newSelected = new Set(selectedWeeks);
    if (newSelected.has(week)) {
      newSelected.delete(week);
    } else {
      newSelected.add(week);
    }
    setSelectedWeeks(newSelected);
  };

  const updatePrice = (week: number, airline: string, price: string) => {
    setPrices(prev => ({
      ...prev,
      [week]: {
        ...prev[week],
        [airline]: price,
      },
    }));
  };

  const getLowestPrice = (week: number): number | null => {
    const weekPrices = prices[week];
    if (!weekPrices) return null;
    const values = Object.values(weekPrices).map(p => parseFloat(p)).filter(p => !isNaN(p));
    return values.length > 0 ? Math.min(...values) : null;
  };

  const getPriceColor = (price: number | null, week: number): string => {
    if (!price) return 'text-muted-foreground';
    const lowest = getLowestPrice(week);
    if (!lowest) return 'text-muted-foreground';
    if (price === lowest) return 'text-green-600 font-semibold';
    if (price <= lowest * 1.1) return 'text-yellow-600';
    return 'text-red-600';
  };

  const calculateStats = () => {
    let totalWeeks = 0;
    let totalCost = 0;
    let selectedCount = selectedWeeks.size;

    selectedWeeks.forEach(week => {
      const lowest = getLowestPrice(week);
      if (lowest) {
        totalCost += lowest * 2; // Ida + Retorno
        totalWeeks++;
      }
    });

    return { selectedCount, totalWeeks, totalCost };
  };

  const stats = calculateStats();

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="bg-gradient-to-r from-primary to-primary/80 text-primary-foreground shadow-lg">
        <div className="container py-10">
          <div className="flex items-center gap-3 mb-2">
            <div className="bg-primary-foreground/20 p-2 rounded-lg">
              <Plane className="w-8 h-8" />
            </div>
            <div>
              <h1 className="text-4xl font-bold">Planejador de Passagens Aéreas</h1>
              <p className="text-primary-foreground/90 text-sm mt-1">Guarulhos (GRU) → Navegantes (NVT) • 2026</p>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container py-8">
        {/* Filtros e Controles */}
        <div className="bg-card border border-border rounded-lg p-6 mb-8">
          <h2 className="text-lg font-semibold mb-4">Filtros e Controles</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label className="text-sm font-medium mb-2 block">Mês</label>
              <Select value={filterMonth} onValueChange={setFilterMonth}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos os meses</SelectItem>
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

            <div>
              <label className="text-sm font-medium mb-2 block">Companhia</label>
              <Select value={filterAirline} onValueChange={setFilterAirline}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas as companhias</SelectItem>
                  {airlines.map(airline => (
                    <SelectItem key={airline.id} value={airline.id}>{airline.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="text-sm font-medium mb-2 block">Ordenar por</label>
              <Select value={sortBy} onValueChange={setSortBy}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="week">Semana</SelectItem>
                  <SelectItem value="price">Preço mais baixo</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="text-sm font-medium mb-2 block">Resumo</label>
              <div className="bg-accent/10 border border-accent/20 p-3 rounded text-sm">
                <div className="font-semibold text-accent">{stats.selectedCount} viagens selecionadas</div>
                <div className="text-muted-foreground text-xs">{sortedFlights.length} semanas disponíveis</div>
                {stats.totalCost > 0 && (
                  <div className="mt-2 pt-2 border-t border-accent/20">
                    <div className="text-xs text-muted-foreground">Custo estimado:</div>
                    <div className="font-bold text-accent">R$ {stats.totalCost.toFixed(2)}</div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Tabela de Voos */}
        <div className="space-y-3">
          {sortedFlights.map(flight => (
            <div key={flight.semana} className="flight-card">
              <div
                className="flex items-center justify-between cursor-pointer"
                onClick={() => setExpandedWeek(expandedWeek === flight.semana ? null : flight.semana)}
              >
                <div className="flex items-center gap-4 flex-1">
                  <Checkbox
                    checked={selectedWeeks.has(flight.semana)}
                    onCheckedChange={() => toggleWeek(flight.semana)}
                    onClick={e => e.stopPropagation()}
                  />
                  
                  <div className="flex-1">
                    <div className="font-semibold text-foreground">Semana {flight.semana}</div>
                    <div className="text-sm text-muted-foreground">
                      {flight.ida.data} ({flight.ida.dia_semana}) → {flight.retorno.data} ({flight.retorno.dia_semana})
                    </div>
                  </div>

                  <div className="hidden md:flex items-center gap-2">
                    <MapPin className="w-4 h-4 text-muted-foreground" />
                    <span className="text-sm">{flight.ida.origem} → {flight.retorno.origem}</span>
                  </div>

                  {flight.ida.feriado && (
                    <span className="holiday-badge">🎉 {flight.ida.feriado}</span>
                  )}
                  {flight.retorno.feriado && (
                    <span className="holiday-badge">🎉 {flight.retorno.feriado}</span>
                  )}
                </div>

                <ChevronDown
                  className={`w-5 h-5 text-muted-foreground transition-transform ${
                    expandedWeek === flight.semana ? 'rotate-180' : ''
                  }`}
                />
              </div>

              {/* Seção Expandida */}
              {expandedWeek === flight.semana && (
                <div className="mt-4 pt-4 border-t border-border space-y-4">
                  {/* Detalhes da Ida */}
                  <div>
                    <h4 className="font-semibold text-sm mb-3 flex items-center gap-2">
                      <Plane className="w-4 h-4" />
                      Ida: {flight.ida.data} ({flight.ida.dia_semana})
                    </h4>
                    <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
                      {airlines.map(airline => (
                        <div key={airline.id} className="space-y-2">
                          <label className="text-xs font-medium text-muted-foreground">{airline.name}</label>
                          <div className="flex gap-2">
                            <Input
                              type="number"
                              placeholder="R$"
                              value={prices[flight.semana]?.[airline.id] || ''}
                              onChange={e => updatePrice(flight.semana, airline.id, e.target.value)}
                              className="flex-1"
                            />
                            <Button
                              variant="outline"
                              size="sm"
                              asChild
                              className="px-2"
                            >
                              <a
                                href={generateBookingLink(
                                  airline.id,
                                  flight.ida.data,
                                  flight.ida.destino,
                                  flight.ida.data,
                                  flight.retorno.data,
                                  flight.ida.origem,
                                  flight.ida.destino
                                )}
                                target="_blank"
                                rel="noopener noreferrer"
                              >
                                <ExternalLink className="w-4 h-4" />
                              </a>
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Detalhes do Retorno */}
                  <div>
                    <h4 className="font-semibold text-sm mb-3 flex items-center gap-2">
                      <Plane className="w-4 h-4 rotate-180" />
                      Retorno: {flight.retorno.data} ({flight.retorno.dia_semana})
                    </h4>
                    <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
                      {airlines.map(airline => (
                        <div key={`return-${airline.id}`} className="space-y-2">
                          <label className="text-xs font-medium text-muted-foreground">{airline.name}</label>
                          <div className="flex gap-2">
                            <Input
                              type="number"
                              placeholder="R$"
                              value={prices[flight.semana]?.[`${airline.id}-return`] || ''}
                              onChange={e => updatePrice(flight.semana, `${airline.id}-return`, e.target.value)}
                              className="flex-1"
                            />
                            <Button
                              variant="outline"
                              size="sm"
                              asChild
                              className="px-2"
                            >
                              <a
                                href={generateBookingLink(
                                  airline.id,
                                  flight.retorno.data,
                                  flight.retorno.origem,
                                  flight.ida.data,
                                  flight.retorno.data,
                                  flight.retorno.origem,
                                  flight.retorno.destino
                                )}
                                target="_blank"
                                rel="noopener noreferrer"
                              >
                                <ExternalLink className="w-4 h-4" />
                              </a>
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Resumo de Preços */}
                  <div className="bg-secondary p-3 rounded">
                    <h5 className="text-xs font-semibold mb-2">Melhor Preço</h5>
                    <div className="text-lg font-bold text-accent">
                      {getLowestPrice(flight.semana)
                        ? `R$ ${getLowestPrice(flight.semana)?.toFixed(2)}`
                        : 'Adicione preços'}
                    </div>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Estatísticas e Informações */}
        {stats.selectedCount > 0 && (
          <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <div className="flex items-center gap-2 mb-2">
                <div className="bg-green-100 p-2 rounded">
                  <Plane className="w-4 h-4 text-green-600" />
                </div>
                <h4 className="font-semibold text-green-900">Viagens Selecionadas</h4>
              </div>
              <p className="text-2xl font-bold text-green-600">{stats.selectedCount}</p>
              <p className="text-xs text-green-700 mt-1">Semanas planejadas</p>
            </div>

            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <div className="flex items-center gap-2 mb-2">
                <div className="bg-blue-100 p-2 rounded">
                  <TrendingDown className="w-4 h-4 text-blue-600" />
                </div>
                <h4 className="font-semibold text-blue-900">Melhor Preço Médio</h4>
              </div>
              <p className="text-2xl font-bold text-blue-600">
                {stats.selectedCount > 0 ? `R$ ${(stats.totalCost / stats.selectedCount / 2).toFixed(0)}` : '-'}
              </p>
              <p className="text-xs text-blue-700 mt-1">Por trecho</p>
            </div>

            <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
              <div className="flex items-center gap-2 mb-2">
                <div className="bg-orange-100 p-2 rounded">
                  <DollarSign className="w-4 h-4 text-orange-600" />
                </div>
                <h4 className="font-semibold text-orange-900">Custo Total</h4>
              </div>
              <p className="text-2xl font-bold text-orange-600">R$ {stats.totalCost.toFixed(2)}</p>
              <p className="text-xs text-orange-700 mt-1">Ida + Retorno</p>
            </div>
          </div>
        )}

        {/* Rodapé com Informações */}
        <div className="mt-12 bg-secondary border border-border rounded-lg p-6">
          <div className="flex items-start gap-3 mb-4">
            <AlertCircle className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
            <div>
              <h3 className="font-semibold mb-3">Como usar este planejador</h3>
              <ul className="space-y-2 text-sm text-foreground">
                <li>✓ Selecione as semanas que deseja viajar usando as caixas de seleção</li>
                <li>✓ Preencha os preços de cada companhia aérea (ida e retorno)</li>
                <li>✓ Use os links externos para comparar preços em tempo real</li>
                <li>✓ O melhor preço é destacado automaticamente em verde</li>
                <li>✓ Filtre por mês ou companhia para visualizar dados específicos</li>
                <li>✓ Voos com feriados são destacados com 🎉</li>
              </ul>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
