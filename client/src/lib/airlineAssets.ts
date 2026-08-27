/**
 * Ativos de marca entregues pelo endpoint same-origin do Smart Fly. O prefixo
 * próprio evita a rota reservada de armazenamento no domínio publicado.
 */
export const AIRLINE_LOGO_ASSETS = {
  latam: "/smartfly-assets/smartfly-airline-latam_c982c0a8.png?v=20260827",
  gol: "/smartfly-assets/smartfly-airline-gol_5f97474c.png?v=20260827",
  azul: "/smartfly-assets/smartfly-airline-azul_56363add.png?v=20260827",
} as const;

export type StandardAirlineId = keyof typeof AIRLINE_LOGO_ASSETS;

export function getAirlineLogoAsset(airline: string | null | undefined) {
  const normalized = airline?.trim().toLowerCase() as StandardAirlineId | undefined;
  return normalized ? AIRLINE_LOGO_ASSETS[normalized] : undefined;
}
