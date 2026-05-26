/**
 * Complete addresses of Brazilian airports
 * Used for Google Calendar event locations
 */

export const airportAddresses: Record<
  string,
  { name: string; address: string }
> = {
  GRU: {
    name: "Aeroporto Internacional de São Paulo/Guarulhos",
    address:
      "Avenida Monteiro de Carvalho, 1000, Guarulhos, SP 07034-902, Brasil",
  },
  NVT: {
    name: "Aeroporto de Navegantes",
    address: "Rodovia BR-116, km 0, Navegantes, SC 88375-000, Brasil",
  },
  CCJ: {
    name: "Aeroporto de Campinas/Viracopos",
    address: "Rodovia SP-332, km 72, Campinas, SP 13100-000, Brasil",
  },
  SDU: {
    name: "Aeroporto Santos Dumont",
    address:
      "Praça Senador Salgado Filho, s/n, Rio de Janeiro, RJ 20040-020, Brasil",
  },
  GIG: {
    name: "Aeroporto Internacional do Rio de Janeiro",
    address: "Av. Vinte de Janeiro, 3000, Rio de Janeiro, RJ 20040-020, Brasil",
  },
  BSB: {
    name: "Aeroporto Internacional de Brasília",
    address: "Setor de Áreas Especiais, Brasília, DF 70000-000, Brasil",
  },
  BEL: {
    name: "Aeroporto Internacional de Belém",
    address: "Avenida Almirante Protógenes, 1000, Belém, PA 66113-200, Brasil",
  },
  MAO: {
    name: "Aeroporto Internacional de Manaus",
    address: "Avenida Santos Dumont, 1350, Manaus, AM 69000-000, Brasil",
  },
  REC: {
    name: "Aeroporto Internacional de Recife",
    address: "Avenida Mascarenhas de Moraes, s/n, Recife, PE 52071-011, Brasil",
  },
  SSA: {
    name: "Aeroporto Internacional de Salvador",
    address: "Avenida Luiz Viana Filho, 8000, Salvador, BA 41720-000, Brasil",
  },
  FOR: {
    name: "Aeroporto Internacional de Fortaleza",
    address: "Avenida Dioguardi, 3000, Fortaleza, CE 60000-000, Brasil",
  },
  CWB: {
    name: "Aeroporto Internacional de Curitiba",
    address: "Avenida Rocha Pombo, 1000, Curitiba, PR 82000-000, Brasil",
  },
  POA: {
    name: "Aeroporto Internacional de Porto Alegre",
    address: "Avenida Severo Dullius, 901, Porto Alegre, RS 90000-000, Brasil",
  },
  VCP: {
    name: "Aeroporto de Campinas/Viracopos",
    address: "Rodovia SP-332, km 72, Campinas, SP 13100-000, Brasil",
  },
};

/**
 * Get airport address by code
 */
export function getAirportAddress(code: string): string {
  const airport = airportAddresses[code.toUpperCase()];
  if (!airport) {
    return code; // Return code if address not found
  }
  return `${airport.name} - ${airport.address}`;
}

/**
 * Get airport name by code
 */
export function getAirportName(code: string): string {
  const airport = airportAddresses[code.toUpperCase()];
  return airport?.name || code;
}
