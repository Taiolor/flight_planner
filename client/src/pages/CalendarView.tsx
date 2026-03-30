import { useMemo } from 'react';
import { Link } from 'wouter';
import { trpc } from '@/lib/trpc';
import { ArrowLeft, Plane, Circle } from 'lucide-react';

const MONTHS = [
  'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
  'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro',
];

const WEEKDAYS = ['D', 'S', 'T', 'Q', 'Q', 'S', 'S'];

const YEAR = 2026;

// Feriados nacionais e estaduais relevantes (formato: 'YYYY-MM-DD' → label)
const HOLIDAYS: Record<string, string> = {
  '2026-01-01': 'Ano Novo',
  '2026-02-16': 'Carnaval',
  '2026-02-17': 'Carnaval',
  '2026-02-18': 'Carnaval',
  '2026-04-03': 'Paixão de Cristo',
  '2026-04-05': 'Páscoa',
  '2026-04-21': 'Tiradentes',
  '2026-05-01': 'Dia do Trabalho',
  '2026-06-04': 'Corpus Christi',
  '2026-09-07': 'Independência',
  '2026-10-12': 'N. Sra. Aparecida',
  '2026-11-02': 'Finados',
  '2026-11-15': 'Proclamação da República',
  '2026-11-20': 'Consciência Negra',
  '2026-12-25': 'Natal',
};

function parseDate(dateStr: string): Date | null {
  // Suporta "DD/MM/YYYY" e "YYYY-MM-DD"
  if (!dateStr) return null;
  if (dateStr.includes('/')) {
    const [d, m, y] = dateStr.split('/');
    return new Date(Number(y), Number(m) - 1, Number(d));
  }
  const [y, m, d] = dateStr.split('-');
  return new Date(Number(y), Number(m) - 1, Number(d));
}

function toKey(date: Date): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
}

export default function CalendarView() {
  const weeksQuery = trpc.flights.getWeeks.useQuery();

  const today = useMemo(() => {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    return d;
  }, []);

  // Mapear dias marcados: key → { type: 'departure'|'return'|'both', isPast, airline }
  type DayMark = { departure: boolean; return: boolean; isPast: boolean; airline?: string };
  const markedDays = useMemo<Record<string, DayMark>>(() => {
    const map: Record<string, DayMark> = {};
    if (!weeksQuery.data) return map;

    for (const week of weeksQuery.data) {
      if (!week.isTicketIssued) continue;

      const depDate = parseDate(week.departureDate);
      const retDate = parseDate(week.returnDate);

      if (depDate) {
        const key = toKey(depDate);
        const isPast = depDate < today;
        if (!map[key]) map[key] = { departure: false, return: false, isPast };
        map[key].departure = true;
        map[key].isPast = isPast;
        if ((week as any).departureAirline) map[key].airline = (week as any).departureAirline;
      }

      // Só marcar a volta se for Ida e Volta (ticketType !== 'oneway')
      const ticketType = (week as any).ticketType ?? 'roundtrip';
      if (retDate && ticketType !== 'oneway') {
        const key = toKey(retDate);
        const isPast = retDate < today;
        if (!map[key]) map[key] = { departure: false, return: false, isPast };
        map[key].return = true;
        if (!map[key].departure) map[key].isPast = isPast;
        if ((week as any).returnAirline) map[key].airline = (week as any).returnAirline;
      }
    }
    return map;
  }, [weeksQuery.data, today]);

  // Construir grade de cada mês
  function buildMonthGrid(year: number, month: number): (number | null)[][] {
    const firstDay = new Date(year, month, 1).getDay(); // 0=Dom
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const cells: (number | null)[] = Array(firstDay).fill(null);
    for (let d = 1; d <= daysInMonth; d++) cells.push(d);
    while (cells.length % 7 !== 0) cells.push(null);
    const weeks: (number | null)[][] = [];
    for (let i = 0; i < cells.length; i += 7) weeks.push(cells.slice(i, i + 7));
    return weeks;
  }

  // Contar passagens emitidas no mês
  function countIssuedInMonth(month: number): number {
    if (!weeksQuery.data) return 0;
    return weeksQuery.data.filter(w => {
      if (!w.isTicketIssued) return false;
      const dep = parseDate(w.departureDate);
      return dep && dep.getMonth() === month && dep.getFullYear() === YEAR;
    }).length;
  }

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Cabeçalho */}
      <header className="bg-blue-700 text-white px-4 py-3 flex items-center gap-3 shadow-md sticky top-0 z-10">
        <Link href="/">
          <button className="flex items-center gap-1.5 text-white/80 hover:text-white transition-colors text-sm font-medium">
            <ArrowLeft className="w-4 h-4" />
            Voltar
          </button>
        </Link>
        <div className="flex items-center gap-2 ml-2">
          <Plane className="w-5 h-5" />
          <h1 className="text-base font-bold tracking-wide">Calendário de Voos 2026</h1>
        </div>
        {/* Legenda */}
        <div className="ml-auto flex items-center gap-4 text-xs">
          <span className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-full bg-emerald-400 inline-block" />
            Emitido (futuro)
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-full bg-slate-500 inline-block" />
            Emitido (passado)
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-full bg-amber-300 inline-block" />
            Feriado
          </span>
        </div>
      </header>

      {/* Grade anual */}
      <main className="px-4 py-6 max-w-7xl mx-auto">
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-5">
          {MONTHS.map((monthName, monthIdx) => {
            const grid = buildMonthGrid(YEAR, monthIdx);
            const issuedCount = countIssuedInMonth(monthIdx);

            return (
              <div
                key={monthIdx}
                className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden"
              >
                {/* Cabeçalho do mês */}
                <div className="bg-blue-700 px-3 py-2 flex items-center justify-between">
                  <span className="text-white font-bold text-sm">{monthName}</span>
                  {issuedCount > 0 && (
                    <span className="flex items-center gap-1 bg-emerald-400/20 border border-emerald-300/40 text-emerald-200 text-[10px] font-semibold px-2 py-0.5 rounded-full">
                      <Plane className="w-2.5 h-2.5" />
                      {issuedCount} {issuedCount === 1 ? 'voo' : 'voos'}
                    </span>
                  )}
                </div>

                {/* Dias da semana */}
                <div className="grid grid-cols-7 bg-blue-50 border-b border-blue-100">
                  {WEEKDAYS.map((wd, i) => (
                    <div
                      key={i}
                      className={`text-center text-[9px] font-bold py-1 ${
                        i === 0 ? 'text-red-400' : i === 6 ? 'text-blue-400' : 'text-slate-400'
                      }`}
                    >
                      {wd}
                    </div>
                  ))}
                </div>

                {/* Células dos dias */}
                <div className="p-1.5">
                  {grid.map((week, wi) => (
                    <div key={wi} className="grid grid-cols-7 gap-0.5">
                      {week.map((day, di) => {
                        if (!day) return <div key={di} />;

                        const dateObj = new Date(YEAR, monthIdx, day);
                        const key = toKey(dateObj);
                        const mark = markedDays[key];
                        const holiday = HOLIDAYS[key];
                        const isToday = toKey(dateObj) === toKey(today);
                        const isSunday = di === 0;
                        const isSaturday = di === 6;

                        let cellBg = '';
                        let textColor = isSunday ? 'text-red-500' : isSaturday ? 'text-blue-500' : 'text-slate-700';
                        let dotColor = '';
                        let title = '';

                        if (mark) {
                          if (mark.isPast) {
                            cellBg = 'bg-slate-500';
                            textColor = 'text-white';
                          } else {
                            cellBg = 'bg-emerald-500';
                            textColor = 'text-white';
                          }
                          const legs = [];
                          if (mark.departure) legs.push('Ida');
                          if (mark.return) legs.push('Volta');
                          title = legs.join(' + ');
                          if (mark.airline) title += ` · ${mark.airline}`;
                        } else if (holiday) {
                          dotColor = 'bg-amber-300';
                          title = holiday;
                        }

                        if (isToday && !mark) {
                          cellBg = 'bg-blue-100';
                          textColor = 'text-blue-700 font-bold';
                        }

                        return (
                          <div
                            key={di}
                            title={title || undefined}
                            className={`relative flex flex-col items-center justify-center rounded-md aspect-square text-[10px] font-medium cursor-default select-none transition-all
                              ${cellBg || 'hover:bg-slate-50'}
                              ${textColor}
                              ${isToday && !mark ? 'ring-1 ring-blue-400' : ''}
                            `}
                          >
                            <span>{day}</span>
                            {/* Indicador de feriado (ponto âmbar) quando não há voo */}
                            {holiday && !mark && (
                              <span className="absolute bottom-0.5 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-amber-400" />
                            )}
                            {/* Indicador de tipo (ida/volta) quando há voo */}
                            {mark && (
                              <span className="absolute bottom-0.5 left-1/2 -translate-x-1/2 flex gap-0.5">
                                {mark.departure && (
                                  <span className={`w-1 h-1 rounded-full ${mark.isPast ? 'bg-slate-300' : 'bg-white'}`} />
                                )}
                                {mark.return && (
                                  <span className={`w-1 h-1 rounded-full ${mark.isPast ? 'bg-slate-300' : 'bg-emerald-200'}`} />
                                )}
                              </span>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>

        {/* Rodapé com resumo */}
        <div className="mt-6 bg-white rounded-2xl border border-slate-100 shadow-sm p-4 flex flex-wrap gap-6 items-center">
          <div className="text-sm text-slate-500 font-medium">Resumo 2026</div>
          {weeksQuery.isLoading ? (
            <span className="text-xs text-slate-400">Carregando...</span>
          ) : (
            <>
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-full bg-emerald-500 inline-block" />
                <span className="text-sm font-semibold text-slate-700">
                  {weeksQuery.data?.filter(w => {
                    if (!w.isTicketIssued) return false;
                    const dep = parseDate(w.departureDate);
                    return dep && dep >= today;
                  }).length ?? 0} voos futuros emitidos
                </span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-full bg-slate-500 inline-block" />
                <span className="text-sm font-semibold text-slate-700">
                  {weeksQuery.data?.filter(w => {
                    if (!w.isTicketIssued) return false;
                    const dep = parseDate(w.departureDate);
                    return dep && dep < today;
                  }).length ?? 0} voos passados
                </span>
              </div>
              <div className="flex items-center gap-2">
                <Circle className="w-3 h-3 text-slate-300" />
                <span className="text-sm font-semibold text-slate-700">
                  {weeksQuery.data?.filter(w => !w.isTicketIssued && !w.isDeleted).length ?? 0} semanas sem bilhete
                </span>
              </div>
            </>
          )}
        </div>
      </main>
    </div>
  );
}
