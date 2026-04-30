export const AIRLINE_NAMES: Record<string, string> = {
  LA: "LATAM",
  la: "LATAM",
  latam: "LATAM",
  LATAM: "LATAM",
  G3: "Gol",
  g3: "Gol",
  gol: "Gol",
  GOL: "Gol",
  AD: "Azul",
  ad: "Azul",
  azul: "Azul",
  AZUL: "Azul",
};

export function formatAirline(code: string): string {
  return AIRLINE_NAMES[code] ?? code;
}

export function formatRelativeTime(isoString: string): string {
  const target = new Date(isoString);
  const now = new Date();
  const diffMs = target.getTime() - now.getTime();
  const diffMin = Math.round(diffMs / 60000);

  if (diffMin < -60 * 24) {
    const days = Math.round(Math.abs(diffMin) / (60 * 24));
    return `há ${days} dia${days !== 1 ? "s" : ""}`;
  }
  if (diffMin < -60) {
    const hours = Math.round(Math.abs(diffMin) / 60);
    return `há ${hours}h`;
  }
  if (diffMin < 0) return `há ${Math.abs(diffMin)}min`;
  if (diffMin === 0) return "agora";
  if (diffMin < 60) return `em ${diffMin}min`;
  if (diffMin < 60 * 24) {
    const hours = Math.floor(diffMin / 60);
    const mins = diffMin % 60;
    return mins > 0 ? `em ${hours}h ${mins}min` : `em ${hours}h`;
  }
  const days = Math.floor(diffMin / (60 * 24));
  const hours = Math.floor((diffMin % (60 * 24)) / 60);
  return hours > 0 ? `em ${days}d ${hours}h` : `em ${days}d`;
}

export function formatDatetimeBRT(isoString: string): string {
  try {
    return new Date(isoString).toLocaleString("pt-BR", {
      timeZone: "America/Sao_Paulo",
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return isoString;
  }
}
