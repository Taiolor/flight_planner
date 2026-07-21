/**
 * Feriados de 2026 para Blumenau, SC
 * Inclui: Feriados Nacionais, Estaduais (SC) e Municipais (Blumenau)
 */

export interface Holiday {
  date: string; // formato "DD/MM"
  name: string;
  type: "national" | "state" | "municipal";
}

export const holidays2026: Holiday[] = [
  // Feriados Nacionais
  { date: "01/01", name: "Confraternização Universal", type: "national" },
  { date: "03/04", name: "Sexta-feira Santa", type: "national" },
  { date: "21/04", name: "Tiradentes", type: "national" },
  { date: "01/05", name: "Dia do Trabalhador", type: "national" },
  { date: "04/06", name: "Corpus Christi", type: "national" },
  { date: "07/09", name: "Independência do Brasil", type: "national" },
  { date: "12/10", name: "Nossa Senhora Aparecida", type: "national" },
  { date: "02/11", name: "Finados", type: "national" },
  { date: "15/11", name: "Proclamação da República", type: "national" },
  { date: "25/12", name: "Natal", type: "national" },

  // Feriados Estaduais (Santa Catarina)
  // SC não possui feriados estaduais específicos além dos nacionais em 2026

  // Feriados Municipais (Blumenau)
  { date: "02/09", name: "Aniversário de Blumenau", type: "municipal" },
];

const holidaysMap = new Map<string, Holiday>(
  holidays2026.map(h => [h.date, h])
);

/**
 * Função para verificar se uma data é feriado
 * @param day - dia (1-31)
 * @param month - mês (1-12)
 * @returns Holiday ou undefined
 */
export function getHolidayByDate(
  day: number,
  month: number
): Holiday | undefined {
  const dateStr = `${String(day).padStart(2, "0")}/${String(month).padStart(2, "0")}`;
  return holidaysMap.get(dateStr);
}

/**
 * Função para obter todos os feriados em um intervalo de datas
 * @param startDate - data inicial (formato "DD/MM/YYYY")
 * @param endDate - data final (formato "DD/MM/YYYY")
 * @returns array de feriados no intervalo
 */
export function getHolidaysInRange(
  startDate: string,
  endDate: string
): Holiday[] {
  const parseDate = (
    dateStr: string
  ): { day: number; month: number; year: number } => {
    const [day, month, year] = dateStr.split("/").map(Number);
    return { day, month, year };
  };

  const start = parseDate(startDate);
  const end = parseDate(endDate);

  return holidays2026.filter(holiday => {
    const [day, month] = holiday.date.split("/").map(Number);

    // Comparação simplificada (assume mesmo ano)
    const monthDay = month * 100 + day;
    const startMonthDay = start.month * 100 + start.day;
    const endMonthDay = end.month * 100 + end.day;

    return monthDay >= startMonthDay && monthDay <= endMonthDay;
  });
}

/**
 * Função para formatar feriados como string legível
 * @param holidays - array de feriados
 * @returns string formatada
 */
export function formatHolidays(holidays: Holiday[]): string {
  if (holidays.length === 0) return "";
  return holidays.map(h => `${h.name} (${h.date})`).join(", ");
}
