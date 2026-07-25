export interface FlightLeg {
  data: string;
  dia_semana: string;
  origem: string;
  destino: string;
  horario: string;
  feriado: string | null;
}

export interface Flight {
  semana: number;
  ida: FlightLeg;
  retorno: FlightLeg;
}

export type DepartureAirport = "GRU" | "CGH";

export interface Airline {
  id: string;
  name: string;
  color: string;
  icon: string;
}

export const airlines: Airline[] = [
  { id: "kayak", name: "Kayak", color: "bg-red-500", icon: "🔍" },
  { id: "latam", name: "LATAM", color: "bg-blue-600", icon: "✈️" },
  { id: "gol", name: "Gol", color: "bg-yellow-500", icon: "✈️" },
  { id: "azul", name: "Azul", color: "bg-blue-400", icon: "✈️" },
  { id: "onhappy", name: "Onhappy", color: "bg-green-600", icon: "😊" },
];

// Mapa de cores para ícones SVG das companhias
export const airlineIconColors: Record<string, string> = {
  kayak: "text-red-500",
  latam: "text-blue-600",
  gol: "text-yellow-500",
  azul: "text-blue-400",
  onhappy: "text-green-600",
};

export const airports = {
  GRU: { name: "Guarulhos (GRU)", city: "São Paulo", code: "GRU" },
  CGH: { name: "Congonhas (CGH)", city: "São Paulo", code: "CGH" },
  NVT: { name: "Navegantes (NVT)", city: "Santa Catarina", code: "NVT" },
};

export const departureAirports: Array<{
  value: DepartureAirport;
  label: string;
  description: string;
}> = [
  {
    value: "GRU",
    label: "Guarulhos (GRU)",
    description: "Aeroporto Internacional de Guarulhos - Preferencial",
  },
  {
    value: "CGH",
    label: "Congonhas (CGH)",
    description: "Aeroporto de Congonhas - Alternativa",
  },
];

// Dados de voos gerados automaticamente
// Modificar dados de voos para usar origem como GRU (será selecionável no frontend)
export const flightData: Flight[] = [
  {
    semana: 1,
    ida: {
      data: "01/03/2026",
      dia_semana: "Domingo",
      origem: "GRU",
      destino: "NVT",
      horario: "14:00-22:00",
      feriado: null,
    },
    retorno: {
      data: "06/03/2026",
      dia_semana: "Sexta",
      origem: "NVT",
      destino: "GRU",
      horario: "19:00-23:00",
      feriado: null,
    },
  },
  {
    semana: 2,
    ida: {
      data: "08/03/2026",
      dia_semana: "Domingo",
      origem: "GRU",
      destino: "NVT",
      horario: "14:00-22:00",
      feriado: null,
    },
    retorno: {
      data: "13/03/2026",
      dia_semana: "Sexta",
      origem: "NVT",
      destino: "GRU",
      horario: "19:00-23:00",
      feriado: null,
    },
  },
  {
    semana: 3,
    ida: {
      data: "15/03/2026",
      dia_semana: "Domingo",
      origem: "GRU",
      destino: "NVT",
      horario: "14:00-22:00",
      feriado: null,
    },
    retorno: {
      data: "20/03/2026",
      dia_semana: "Sexta",
      origem: "NVT",
      destino: "GRU",
      horario: "19:00-23:00",
      feriado: null,
    },
  },
  {
    semana: 4,
    ida: {
      data: "22/03/2026",
      dia_semana: "Domingo",
      origem: "GRU",
      destino: "NVT",
      horario: "14:00-22:00",
      feriado: null,
    },
    retorno: {
      data: "27/03/2026",
      dia_semana: "Sexta",
      origem: "NVT",
      destino: "GRU",
      horario: "19:00-23:00",
      feriado: null,
    },
  },
  {
    semana: 5,
    ida: {
      data: "29/03/2026",
      dia_semana: "Domingo",
      origem: "GRU",
      destino: "NVT",
      horario: "14:00-22:00",
      feriado: null,
    },
    retorno: {
      data: "02/04/2026",
      dia_semana: "Quinta",
      origem: "NVT",
      destino: "GRU",
      horario: "19:00-23:00",
      feriado: "Paixão de Cristo",
    },
  },
  {
    semana: 6,
    ida: {
      data: "05/04/2026",
      dia_semana: "Domingo",
      origem: "GRU",
      destino: "NVT",
      horario: "14:00-22:00",
      feriado: null,
    },
    retorno: {
      data: "10/04/2026",
      dia_semana: "Sexta",
      origem: "NVT",
      destino: "GRU",
      horario: "19:00-23:00",
      feriado: null,
    },
  },
  {
    semana: 7,
    ida: {
      data: "12/04/2026",
      dia_semana: "Domingo",
      origem: "GRU",
      destino: "NVT",
      horario: "14:00-22:00",
      feriado: null,
    },
    retorno: {
      data: "17/04/2026",
      dia_semana: "Sexta",
      origem: "NVT",
      destino: "GRU",
      horario: "19:00-23:00",
      feriado: null,
    },
  },
  {
    semana: 8,
    ida: {
      data: "19/04/2026",
      dia_semana: "Domingo",
      origem: "GRU",
      destino: "NVT",
      horario: "14:00-22:00",
      feriado: null,
    },
    retorno: {
      data: "24/04/2026",
      dia_semana: "Sexta",
      origem: "NVT",
      destino: "GRU",
      horario: "19:00-23:00",
      feriado: null,
    },
  },
  {
    semana: 9,
    ida: {
      data: "26/04/2026",
      dia_semana: "Domingo",
      origem: "GRU",
      destino: "NVT",
      horario: "14:00-22:00",
      feriado: null,
    },
    retorno: {
      data: "01/05/2026",
      dia_semana: "Sexta",
      origem: "NVT",
      destino: "GRU",
      horario: "19:00-23:00",
      feriado: "Dia do Trabalho",
    },
  },
  {
    semana: 10,
    ida: {
      data: "03/05/2026",
      dia_semana: "Domingo",
      origem: "GRU",
      destino: "NVT",
      horario: "14:00-22:00",
      feriado: null,
    },
    retorno: {
      data: "08/05/2026",
      dia_semana: "Sexta",
      origem: "NVT",
      destino: "GRU",
      horario: "19:00-23:00",
      feriado: null,
    },
  },
  {
    semana: 11,
    ida: {
      data: "10/05/2026",
      dia_semana: "Domingo",
      origem: "GRU",
      destino: "NVT",
      horario: "14:00-22:00",
      feriado: null,
    },
    retorno: {
      data: "15/05/2026",
      dia_semana: "Sexta",
      origem: "NVT",
      destino: "GRU",
      horario: "19:00-23:00",
      feriado: null,
    },
  },
  {
    semana: 12,
    ida: {
      data: "17/05/2026",
      dia_semana: "Domingo",
      origem: "GRU",
      destino: "NVT",
      horario: "14:00-22:00",
      feriado: null,
    },
    retorno: {
      data: "22/05/2026",
      dia_semana: "Sexta",
      origem: "NVT",
      destino: "GRU",
      horario: "19:00-23:00",
      feriado: null,
    },
  },
  {
    semana: 13,
    ida: {
      data: "24/05/2026",
      dia_semana: "Domingo",
      origem: "GRU",
      destino: "NVT",
      horario: "14:00-22:00",
      feriado: null,
    },
    retorno: {
      data: "29/05/2026",
      dia_semana: "Sexta",
      origem: "NVT",
      destino: "GRU",
      horario: "19:00-23:00",
      feriado: null,
    },
  },
  {
    semana: 14,
    ida: {
      data: "31/05/2026",
      dia_semana: "Domingo",
      origem: "GRU",
      destino: "NVT",
      horario: "14:00-22:00",
      feriado: null,
    },
    retorno: {
      data: "05/06/2026",
      dia_semana: "Sexta",
      origem: "NVT",
      destino: "GRU",
      horario: "19:00-23:00",
      feriado: "Ponto Facultativo",
    },
  },
  {
    semana: 15,
    ida: {
      data: "07/06/2026",
      dia_semana: "Domingo",
      origem: "GRU",
      destino: "NVT",
      horario: "14:00-22:00",
      feriado: null,
    },
    retorno: {
      data: "12/06/2026",
      dia_semana: "Sexta",
      origem: "NVT",
      destino: "GRU",
      horario: "19:00-23:00",
      feriado: null,
    },
  },
  {
    semana: 16,
    ida: {
      data: "14/06/2026",
      dia_semana: "Domingo",
      origem: "GRU",
      destino: "NVT",
      horario: "14:00-22:00",
      feriado: null,
    },
    retorno: {
      data: "19/06/2026",
      dia_semana: "Sexta",
      origem: "NVT",
      destino: "GRU",
      horario: "19:00-23:00",
      feriado: null,
    },
  },
  {
    semana: 17,
    ida: {
      data: "21/06/2026",
      dia_semana: "Domingo",
      origem: "GRU",
      destino: "NVT",
      horario: "14:00-22:00",
      feriado: null,
    },
    retorno: {
      data: "26/06/2026",
      dia_semana: "Sexta",
      origem: "NVT",
      destino: "GRU",
      horario: "19:00-23:00",
      feriado: null,
    },
  },
  {
    semana: 18,
    ida: {
      data: "28/06/2026",
      dia_semana: "Domingo",
      origem: "GRU",
      destino: "NVT",
      horario: "14:00-22:00",
      feriado: null,
    },
    retorno: {
      data: "03/07/2026",
      dia_semana: "Sexta",
      origem: "NVT",
      destino: "GRU",
      horario: "19:00-23:00",
      feriado: null,
    },
  },
  {
    semana: 19,
    ida: {
      data: "05/07/2026",
      dia_semana: "Domingo",
      origem: "GRU",
      destino: "NVT",
      horario: "14:00-22:00",
      feriado: null,
    },
    retorno: {
      data: "10/07/2026",
      dia_semana: "Sexta",
      origem: "NVT",
      destino: "GRU",
      horario: "19:00-23:00",
      feriado: null,
    },
  },
  {
    semana: 20,
    ida: {
      data: "12/07/2026",
      dia_semana: "Domingo",
      origem: "GRU",
      destino: "NVT",
      horario: "14:00-22:00",
      feriado: null,
    },
    retorno: {
      data: "17/07/2026",
      dia_semana: "Sexta",
      origem: "NVT",
      destino: "GRU",
      horario: "19:00-23:00",
      feriado: null,
    },
  },
  {
    semana: 21,
    ida: {
      data: "19/07/2026",
      dia_semana: "Domingo",
      origem: "GRU",
      destino: "NVT",
      horario: "14:00-22:00",
      feriado: null,
    },
    retorno: {
      data: "24/07/2026",
      dia_semana: "Sexta",
      origem: "NVT",
      destino: "GRU",
      horario: "19:00-23:00",
      feriado: null,
    },
  },
  {
    semana: 22,
    ida: {
      data: "26/07/2026",
      dia_semana: "Domingo",
      origem: "GRU",
      destino: "NVT",
      horario: "14:00-22:00",
      feriado: null,
    },
    retorno: {
      data: "31/07/2026",
      dia_semana: "Sexta",
      origem: "NVT",
      destino: "GRU",
      horario: "19:00-23:00",
      feriado: null,
    },
  },
  {
    semana: 23,
    ida: {
      data: "02/08/2026",
      dia_semana: "Domingo",
      origem: "GRU",
      destino: "NVT",
      horario: "14:00-22:00",
      feriado: null,
    },
    retorno: {
      data: "07/08/2026",
      dia_semana: "Sexta",
      origem: "NVT",
      destino: "GRU",
      horario: "19:00-23:00",
      feriado: null,
    },
  },
  {
    semana: 24,
    ida: {
      data: "09/08/2026",
      dia_semana: "Domingo",
      origem: "GRU",
      destino: "NVT",
      horario: "14:00-22:00",
      feriado: null,
    },
    retorno: {
      data: "14/08/2026",
      dia_semana: "Sexta",
      origem: "NVT",
      destino: "GRU",
      horario: "19:00-23:00",
      feriado: null,
    },
  },
  {
    semana: 25,
    ida: {
      data: "16/08/2026",
      dia_semana: "Domingo",
      origem: "GRU",
      destino: "NVT",
      horario: "14:00-22:00",
      feriado: null,
    },
    retorno: {
      data: "21/08/2026",
      dia_semana: "Sexta",
      origem: "NVT",
      destino: "GRU",
      horario: "19:00-23:00",
      feriado: null,
    },
  },
  {
    semana: 26,
    ida: {
      data: "23/08/2026",
      dia_semana: "Domingo",
      origem: "GRU",
      destino: "NVT",
      horario: "14:00-22:00",
      feriado: null,
    },
    retorno: {
      data: "28/08/2026",
      dia_semana: "Sexta",
      origem: "NVT",
      destino: "GRU",
      horario: "19:00-23:00",
      feriado: null,
    },
  },
  {
    semana: 27,
    ida: {
      data: "30/08/2026",
      dia_semana: "Domingo",
      origem: "GRU",
      destino: "NVT",
      horario: "14:00-22:00",
      feriado: null,
    },
    retorno: {
      data: "04/09/2026",
      dia_semana: "Sexta",
      origem: "NVT",
      destino: "GRU",
      horario: "19:00-23:00",
      feriado: null,
    },
  },
  {
    semana: 28,
    ida: {
      data: "06/09/2026",
      dia_semana: "Domingo",
      origem: "GRU",
      destino: "NVT",
      horario: "14:00-22:00",
      feriado: null,
    },
    retorno: {
      data: "11/09/2026",
      dia_semana: "Sexta",
      origem: "NVT",
      destino: "GRU",
      horario: "19:00-23:00",
      feriado: null,
    },
  },
  {
    semana: 29,
    ida: {
      data: "13/09/2026",
      dia_semana: "Domingo",
      origem: "GRU",
      destino: "NVT",
      horario: "14:00-22:00",
      feriado: null,
    },
    retorno: {
      data: "18/09/2026",
      dia_semana: "Sexta",
      origem: "NVT",
      destino: "GRU",
      horario: "19:00-23:00",
      feriado: null,
    },
  },
  {
    semana: 30,
    ida: {
      data: "20/09/2026",
      dia_semana: "Domingo",
      origem: "GRU",
      destino: "NVT",
      horario: "14:00-22:00",
      feriado: null,
    },
    retorno: {
      data: "25/09/2026",
      dia_semana: "Sexta",
      origem: "NVT",
      destino: "GRU",
      horario: "19:00-23:00",
      feriado: null,
    },
  },
  {
    semana: 31,
    ida: {
      data: "27/09/2026",
      dia_semana: "Domingo",
      origem: "GRU",
      destino: "NVT",
      horario: "14:00-22:00",
      feriado: null,
    },
    retorno: {
      data: "02/10/2026",
      dia_semana: "Sexta",
      origem: "NVT",
      destino: "GRU",
      horario: "19:00-23:00",
      feriado: null,
    },
  },
  {
    semana: 32,
    ida: {
      data: "04/10/2026",
      dia_semana: "Domingo",
      origem: "GRU",
      destino: "NVT",
      horario: "14:00-22:00",
      feriado: null,
    },
    retorno: {
      data: "09/10/2026",
      dia_semana: "Sexta",
      origem: "NVT",
      destino: "GRU",
      horario: "19:00-23:00",
      feriado: null,
    },
  },
  {
    semana: 33,
    ida: {
      data: "11/10/2026",
      dia_semana: "Domingo",
      origem: "GRU",
      destino: "NVT",
      horario: "14:00-22:00",
      feriado: null,
    },
    retorno: {
      data: "16/10/2026",
      dia_semana: "Sexta",
      origem: "NVT",
      destino: "GRU",
      horario: "19:00-23:00",
      feriado: null,
    },
  },
  {
    semana: 34,
    ida: {
      data: "18/10/2026",
      dia_semana: "Domingo",
      origem: "GRU",
      destino: "NVT",
      horario: "14:00-22:00",
      feriado: null,
    },
    retorno: {
      data: "23/10/2026",
      dia_semana: "Sexta",
      origem: "NVT",
      destino: "GRU",
      horario: "19:00-23:00",
      feriado: null,
    },
  },
  {
    semana: 35,
    ida: {
      data: "25/10/2026",
      dia_semana: "Domingo",
      origem: "GRU",
      destino: "NVT",
      horario: "14:00-22:00",
      feriado: null,
    },
    retorno: {
      data: "30/10/2026",
      dia_semana: "Sexta",
      origem: "NVT",
      destino: "GRU",
      horario: "19:00-23:00",
      feriado: null,
    },
  },
  {
    semana: 36,
    ida: {
      data: "01/11/2026",
      dia_semana: "Domingo",
      origem: "GRU",
      destino: "NVT",
      horario: "14:00-22:00",
      feriado: null,
    },
    retorno: {
      data: "06/11/2026",
      dia_semana: "Sexta",
      origem: "NVT",
      destino: "GRU",
      horario: "19:00-23:00",
      feriado: null,
    },
  },
  {
    semana: 37,
    ida: {
      data: "08/11/2026",
      dia_semana: "Domingo",
      origem: "GRU",
      destino: "NVT",
      horario: "14:00-22:00",
      feriado: null,
    },
    retorno: {
      data: "13/11/2026",
      dia_semana: "Sexta",
      origem: "NVT",
      destino: "GRU",
      horario: "19:00-23:00",
      feriado: null,
    },
  },
  {
    semana: 38,
    ida: {
      data: "15/11/2026",
      dia_semana: "Domingo",
      origem: "GRU",
      destino: "NVT",
      horario: "14:00-22:00",
      feriado: "Proclamação da República",
    },
    retorno: {
      data: "20/11/2026",
      dia_semana: "Sexta",
      origem: "NVT",
      destino: "GRU",
      horario: "19:00-23:00",
      feriado: "Consciência Negra",
    },
  },
  {
    semana: 39,
    ida: {
      data: "22/11/2026",
      dia_semana: "Domingo",
      origem: "GRU",
      destino: "NVT",
      horario: "14:00-22:00",
      feriado: null,
    },
    retorno: {
      data: "27/11/2026",
      dia_semana: "Sexta",
      origem: "NVT",
      destino: "GRU",
      horario: "19:00-23:00",
      feriado: null,
    },
  },
  {
    semana: 40,
    ida: {
      data: "29/11/2026",
      dia_semana: "Domingo",
      origem: "GRU",
      destino: "NVT",
      horario: "14:00-22:00",
      feriado: null,
    },
    retorno: {
      data: "04/12/2026",
      dia_semana: "Sexta",
      origem: "NVT",
      destino: "GRU",
      horario: "19:00-23:00",
      feriado: null,
    },
  },
  {
    semana: 41,
    ida: {
      data: "06/12/2026",
      dia_semana: "Domingo",
      origem: "GRU",
      destino: "NVT",
      horario: "14:00-22:00",
      feriado: null,
    },
    retorno: {
      data: "11/12/2026",
      dia_semana: "Sexta",
      origem: "NVT",
      destino: "GRU",
      horario: "19:00-23:00",
      feriado: null,
    },
  },
  {
    semana: 42,
    ida: {
      data: "13/12/2026",
      dia_semana: "Domingo",
      origem: "GRU",
      destino: "NVT",
      horario: "14:00-22:00",
      feriado: null,
    },
    retorno: {
      data: "18/12/2026",
      dia_semana: "Sexta",
      origem: "NVT",
      destino: "GRU",
      horario: "19:00-23:00",
      feriado: null,
    },
  },
  {
    semana: 43,
    ida: {
      data: "20/12/2026",
      dia_semana: "Domingo",
      origem: "GRU",
      destino: "NVT",
      horario: "14:00-22:00",
      feriado: null,
    },
    retorno: {
      data: "25/12/2026",
      dia_semana: "Sexta",
      origem: "NVT",
      destino: "GRU",
      horario: "19:00-23:00",
      feriado: "Natal",
    },
  },
  {
    semana: 44,
    ida: {
      data: "27/12/2026",
      dia_semana: "Domingo",
      origem: "GRU",
      destino: "NVT",
      horario: "14:00-22:00",
      feriado: null,
    },
    retorno: {
      data: "01/01/2027",
      dia_semana: "Sexta",
      origem: "NVT",
      destino: "GRU",
      horario: "19:00-23:00",
      feriado: "Confraternização Universal",
    },
  },
];

export function generateBookingLink(
  airline: string,
  departure: string,
  arrival: string,
  departDate: string,
  returnDate: string,
  origin: DepartureAirport,
  destination: string
): string {
  // Se for Kayak, usar formato específico (AAAA-MM-DD)
  if (airline === "kayak") {
    const formatDateKayak = (dateStr: string) => {
      const [day, month, year] = dateStr.split("/");
      return `${year}-${month}-${day}`;
    };
    const depDateKayak = formatDateKayak(departure);
    const retDateKayak = formatDateKayak(returnDate);
    return `https://www.kayak.com.br/flights/${origin}-${destination}/${depDateKayak}/${retDateKayak}?ucs=p1nu6v&sort=bestflight_a`;
  }

  const baseUrls: Record<string, string> = {
    latam: "https://www.latam.com/pt_br/",
    gol: "https://www.voegol.com.br/",
    azul: "https://www.voeazul.com.br/",
  };

  const baseUrl = baseUrls[airline] || baseUrls.latam;

  // Formatar datas para o padrão DDMMMYY (ex: 01MAR26)
  const formatDate = (dateStr: string) => {
    const [day, month, year] = dateStr.split("/");
    const months = [
      "JAN",
      "FEB",
      "MAR",
      "APR",
      "MAY",
      "JUN",
      "JUL",
      "AUG",
      "SEP",
      "OCT",
      "NOV",
      "DEC",
    ];
    return `${day}${months[parseInt(month) - 1]}${year.slice(-2)}`;
  };

  const depDate = formatDate(departure);
  const retDate = formatDate(returnDate);
  const originCode = origin === "CGH" ? "CGH" : "GRU";

  // Adicionar parâmetro de aeroporto de partida se for CGH
  const airportParam = origin === "CGH" ? "&airport=CGH" : "";
  return `${baseUrl}?origin=${originCode}&destination=${destination}&outbound=${depDate}&inbound=${retDate}&adults=1&cabin=economy${airportParam}`;
}

// Lista completa de feriados nacionais e pontos facultativos de 2026
export interface Feriado {
  data: string; // DD/MM/YYYY
  nome: string;
  tipo: "nacional" | "facultativo" | "copa" | "estadual" | "municipal";
}

export const feriados2026: Feriado[] = [
  { data: "01/01/2026", nome: "Confraternização Universal", tipo: "nacional" },
  { data: "16/02/2026", nome: "Carnaval (segunda)", tipo: "facultativo" },
  { data: "17/02/2026", nome: "Carnaval (terça)", tipo: "facultativo" },
  {
    data: "18/02/2026",
    nome: "Quarta-feira de Cinzas (meio dia)",
    tipo: "facultativo",
  },
  {
    data: "03/04/2026",
    nome: "Sexta-feira Santa (Paixão de Cristo)",
    tipo: "nacional",
  },
  { data: "05/04/2026", nome: "Páscoa", tipo: "nacional" },
  { data: "21/04/2026", nome: "Tiradentes", tipo: "nacional" },
  { data: "01/05/2026", nome: "Dia do Trabalho", tipo: "nacional" },
  { data: "04/06/2026", nome: "Corpus Christi", tipo: "nacional" },
  {
    data: "05/06/2026",
    nome: "Ponto Facultativo (após Corpus Christi)",
    tipo: "facultativo",
  },
  { data: "07/09/2026", nome: "Independência do Brasil", tipo: "nacional" },
  { data: "12/10/2026", nome: "Nossa Senhora Aparecida", tipo: "nacional" },
  { data: "02/11/2026", nome: "Finados", tipo: "nacional" },
  { data: "15/11/2026", nome: "Proclamação da República", tipo: "nacional" },
  { data: "20/11/2026", nome: "Consciência Negra", tipo: "nacional" },
  { data: "02/09/2026", nome: "Aniversário de Blumenau", tipo: "municipal" },
  {
    data: "24/12/2026",
    nome: "Véspera de Natal (ponto facultativo)",
    tipo: "facultativo",
  },
  { data: "25/12/2026", nome: "Natal", tipo: "nacional" },
  {
    data: "31/12/2026",
    nome: "Véspera de Ano Novo (ponto facultativo)",
    tipo: "facultativo",
  },
  { data: "01/01/2027", nome: "Confraternização Universal", tipo: "nacional" },

  // ⚽ Copa do Mundo 2026 — Jogos do Brasil (Fase de Grupos)
  {
    data: "13/06/2026",
    nome: "⚽ Brasil x Marrocos (Copa 2026 — Grupo C) — 16h (Brasília)",
    tipo: "copa",
  },
  {
    data: "19/06/2026",
    nome: "⚽ Brasil x Haiti (Copa 2026 — Grupo C) — 21h (Brasília)",
    tipo: "copa",
  },
  {
    data: "24/06/2026",
    nome: "⚽ Escócia x Brasil (Copa 2026 — Grupo C) — 20h (Brasília)",
    tipo: "copa",
  },

  // ⚽ Copa do Mundo 2026 — Fase Eliminatória (possível participação do Brasil)
  {
    data: "28/06/2026",
    nome: "⚽ Copa 2026 — 32-avos de Final (início) — Múltiplos horários",
    tipo: "copa",
  },
  {
    data: "03/07/2026",
    nome: "⚽ Copa 2026 — 32-avos de Final (fim) — Múltiplos horários",
    tipo: "copa",
  },
  {
    data: "04/07/2026",
    nome: "⚽ Copa 2026 — Oitavas de Final (início) — Múltiplos horários",
    tipo: "copa",
  },
  {
    data: "07/07/2026",
    nome: "⚽ Copa 2026 — Oitavas de Final (fim) — Múltiplos horários",
    tipo: "copa",
  },
  {
    data: "09/07/2026",
    nome: "⚽ Copa 2026 — Quartas de Final (início) — Múltiplos horários",
    tipo: "copa",
  },
  {
    data: "11/07/2026",
    nome: "⚽ Copa 2026 — Quartas de Final (fim) — Múltiplos horários",
    tipo: "copa",
  },
  {
    data: "14/07/2026",
    nome: "⚽ Copa 2026 — Semifinal 1 (Dallas) — 22h (Brasília)",
    tipo: "copa",
  },
  {
    data: "15/07/2026",
    nome: "⚽ Copa 2026 — Semifinal 2 (Dallas) — 22h (Brasília)",
    tipo: "copa",
  },
  {
    data: "18/07/2026",
    nome: "⚽ Copa 2026 — Disputa 3º Lugar (Miami) — 20h (Brasília)",
    tipo: "copa",
  },
  {
    data: "19/07/2026",
    nome: "⚽ Copa 2026 — FINAL (Nova Jersey) — 20h (Brasília)",
    tipo: "copa",
  },
];

// ⚡ Bolt Optimization:
// Converte string de data DD/MM/YYYY para um número YYYYMMDD para
// comparações rápidas sem instanciar objetos Date.
function dateToInt(dateStr: string): number {
  return parseInt(
    dateStr.substring(6, 10) +
      dateStr.substring(3, 5) +
      dateStr.substring(0, 2),
    10
  );
}

// ⚡ Bolt Optimization:
// Pré-calcula as representações inteiras dos feriados para evitar cálculos repetidos no loop.
const feriados2026Ints = feriados2026.map(f => ({
  ...f,
  dataInt: dateToInt(f.data),
}));

export interface FeriadoInfo {
  feriado: Feriado;
  tipo: "ida" | "retorno" | "intervalo";
}

/**
 * Retorna todos os feriados relacionados a uma semana:
 * - na data de ida
 * - na data de retorno
 * - no intervalo entre ida e retorno (exclusive as datas extremas)
 */
export function getFeriadosDaSemana(
  departureDate: string,
  returnDate: string
): FeriadoInfo[] {
  const result: FeriadoInfo[] = [];

  // ⚡ Bolt Optimization: Uso de inteiros para performance em render loops.
  // Evita múltiplas alocações de array (.split) e instâncias de Date.
  const depTime = dateToInt(departureDate);
  const retTime = dateToInt(returnDate);

  for (let i = 0; i < feriados2026Ints.length; i++) {
    const fObj = feriados2026Ints[i];
    const fTime = fObj.dataInt;

    if (fTime === depTime) {
      result.push({ feriado: fObj, tipo: "ida" });
    } else if (fTime === retTime) {
      result.push({ feriado: fObj, tipo: "retorno" });
    } else if (fTime > depTime && fTime < retTime) {
      result.push({ feriado: fObj, tipo: "intervalo" });
    }
  }
  return result;
}

/**
 * Retorna todos os feriados no intervalo de uma semana.
 * Aceita datas opcionais — se não fornecidas, usa as datas padrão do flightData pelo número da semana.
 * Sempre mostra feriados no intervalo independente de haver viagem cadastrada.
 */
export function getFeriadosPorIntervalo(
  weekNumber: number,
  departureDate?: string,
  returnDate?: string
): FeriadoInfo[] {
  const defaultFlight = flightData.find(f => f.semana === weekNumber);
  const depStr = departureDate || defaultFlight?.ida.data;
  const retStr = returnDate || defaultFlight?.retorno.data;

  if (!depStr || !retStr) return [];
  return getFeriadosDaSemana(depStr, retStr);
}
