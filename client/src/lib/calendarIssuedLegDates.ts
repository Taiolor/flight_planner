export interface CalendarIssuedWeek {
  departureDate: string;
  returnDate: string;
  departureFlightDatetime?: string | null;
  returnFlightDatetime?: string | null;
  ticketType?: string | null;
}

function getDateOnly(value?: string | null): string | null {
  const normalized = value?.trim();
  return normalized ? normalized.slice(0, 10) : null;
}

/**
 * Define os dias realmente emitidos para o Calendário. Quando houver uma data
 * do bilhete, ela prevalece sobre a data planejada da semana; registros legados
 * sem horário de voo continuam usando o planejamento como fallback.
 */
export function getCalendarIssuedLegDates(week: CalendarIssuedWeek) {
  const isOneway = (week.ticketType ?? "roundtrip") === "oneway";

  return {
    departureDate: getDateOnly(week.departureFlightDatetime) ?? week.departureDate,
    returnDate: isOneway
      ? null
      : getDateOnly(week.returnFlightDatetime) ?? week.returnDate,
  };
}
