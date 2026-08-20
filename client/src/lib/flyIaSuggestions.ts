const GENERAL_FOLLOW_UPS = [
  "Qual é meu próximo voo?",
  "Há algum voo cancelado?",
  "Quanto já foi gasto em passagens?",
];

export function getFlyIaFollowUpPrompts(response: string) {
  const normalized = response.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();

  if (/proximo voo|data e hora|terminal|companhia|rota/.test(normalized)) {
    return [
      "Quais são os detalhes do próximo voo?",
      "Há algum voo cancelado ou remarcado?",
      "Qual é a distância total planejada?",
    ];
  }

  if (/r\$|gasto|investido|valor|passagem|orcamento/.test(normalized)) {
    return [
      "Quanto já foi gasto em passagens?",
      "Qual é o orçamento disponível?",
      "Quais compras ainda não foram emitidas?",
    ];
  }

  if (/cancelad|remarcad/.test(normalized)) {
    return [
      "Quais voos foram remarcados?",
      "Qual é meu próximo voo ativo?",
      "Quais cidades estão no planejamento?",
    ];
  }

  if (/cidade|aeroporto|origem|destino/.test(normalized)) {
    return [
      "Quais cidades estão no planejamento?",
      "Qual é a distância total planejada?",
      "Qual é meu próximo voo?",
    ];
  }

  if (/distancia|quilometr|\bkm\b/.test(normalized)) {
    return [
      "Qual é a distância total planejada?",
      "Quais cidades estão no planejamento?",
      "Qual é meu próximo voo?",
    ];
  }

  return GENERAL_FOLLOW_UPS;
}
