export type FlyIaSuggestionTopic = "flight" | "finance" | "alert" | "city" | "distance" | "general";
export type FlyIaSuggestionPreferences = Partial<Record<FlyIaSuggestionTopic, number>>;

export const FLY_IA_SUGGESTION_TOPIC_LABELS: Record<FlyIaSuggestionTopic, string> = {
  flight: "Voos",
  finance: "Gastos",
  alert: "Alertas",
  city: "Cidades",
  distance: "Distâncias",
  general: "Planejamento",
};

const GENERAL_FOLLOW_UPS = [
  "Qual é meu próximo voo?",
  "Há algum voo cancelado?",
  "Quanto já foi gasto em passagens?",
];

function normalize(value: string) {
  return value.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
}

export function getFlyIaSuggestionTopic(prompt: string): FlyIaSuggestionTopic {
  const value = normalize(prompt);
  if (/cancelad|remarcad/.test(value)) return "alert";
  if (/r\$|gasto|investido|valor|passagem|orcamento|compras?/.test(value)) return "finance";
  if (/distancia|quilometr|\bkm\b/.test(value)) return "distance";
  if (/cidade|aeroporto|origem|destino/.test(value)) return "city";
  if (/voo|terminal|companhia|rota|data e hora/.test(value)) return "flight";
  return "general";
}

export function recordFlyIaSuggestionPreference(
  preferences: FlyIaSuggestionPreferences,
  prompt: string
): FlyIaSuggestionPreferences {
  const topic = getFlyIaSuggestionTopic(prompt);
  return {
    ...preferences,
    // Limite baixo evita que uma sequência de toques elimine a diversidade.
    [topic]: Math.min((preferences[topic] ?? 0) + 1, 3),
  };
}

export function getFlyIaDominantSuggestionTopic(preferences: FlyIaSuggestionPreferences) {
  return (Object.entries(preferences) as Array<[FlyIaSuggestionTopic, number]>)
    .filter(([, score]) => score > 0)
    .sort(([, scoreA], [, scoreB]) => scoreB - scoreA)[0]?.[0] ?? null;
}

export function clearFlyIaSuggestionTopic(
  preferences: FlyIaSuggestionPreferences,
  topic: FlyIaSuggestionTopic
): FlyIaSuggestionPreferences {
  const next = { ...preferences };
  delete next[topic];
  return next;
}

export function prioritizeFlyIaSuggestions(
  prompts: string[],
  preferences: FlyIaSuggestionPreferences = {}
) {
  return prompts
    .map((prompt, index) => ({
      prompt,
      index,
      score: preferences[getFlyIaSuggestionTopic(prompt)] ?? 0,
    }))
    .sort((a, b) => b.score - a.score || a.index - b.index)
    .map(item => item.prompt);
}

export function getFlyIaFollowUpPrompts(
  response: string,
  preferences: FlyIaSuggestionPreferences = {}
) {
  const normalized = normalize(response);
  let prompts: string[];

  if (/proximo voo|data e hora|terminal|companhia|rota/.test(normalized)) {
    prompts = [
      "Quais são os detalhes do próximo voo?",
      "Há algum voo cancelado ou remarcado?",
      "Qual é a distância total planejada?",
    ];
  } else if (/r\$|gasto|investido|valor|passagem|orcamento/.test(normalized)) {
    prompts = [
      "Quanto já foi gasto em passagens?",
      "Qual é o orçamento disponível?",
      "Quais compras ainda não foram emitidas?",
    ];
  } else if (/cancelad|remarcad/.test(normalized)) {
    prompts = [
      "Quais voos foram remarcados?",
      "Qual é meu próximo voo ativo?",
      "Quais cidades estão no planejamento?",
    ];
  } else if (/cidade|aeroporto|origem|destino/.test(normalized)) {
    prompts = [
      "Quais cidades estão no planejamento?",
      "Qual é a distância total planejada?",
      "Qual é meu próximo voo?",
    ];
  } else if (/distancia|quilometr|\bkm\b/.test(normalized)) {
    prompts = [
      "Qual é a distância total planejada?",
      "Quais cidades estão no planejamento?",
      "Qual é meu próximo voo?",
    ];
  } else {
    prompts = GENERAL_FOLLOW_UPS;
  }

  return prioritizeFlyIaSuggestions(prompts, preferences);
}
