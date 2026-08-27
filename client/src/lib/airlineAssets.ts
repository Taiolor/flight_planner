/**
 * Ativos de marca servidos pelo proxy do projeto. As URLs evitam depender de
 * objetos CloudFront legados que podem ter MIME inconsistente em produção.
 */
export const AIRLINE_LOGO_ASSETS = {
  latam: "/manus-storage/smartfly-airline-latam_c982c0a8.png?v=20260827",
  gol: "/manus-storage/smartfly-airline-gol_5f97474c.png?v=20260827",
  azul: "/manus-storage/smartfly-airline-azul_56363add.png?v=20260827",
} as const;

export type StandardAirlineId = keyof typeof AIRLINE_LOGO_ASSETS;

export function getAirlineLogoAsset(airline: string | null | undefined) {
  const normalized = airline?.trim().toLowerCase() as StandardAirlineId | undefined;
  return normalized ? AIRLINE_LOGO_ASSETS[normalized] : undefined;
}
