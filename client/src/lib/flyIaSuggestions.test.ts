import { describe, expect, it } from "vitest";
import {
  clearFlyIaSuggestionTopic,
  getFlyIaDominantSuggestionTopic,
  getFlyIaFollowUpPrompts,
  recordFlyIaSuggestionPreference,
} from "./flyIaSuggestions";

describe("getFlyIaFollowUpPrompts", () => {
  it("sugere detalhes operacionais após uma resposta sobre voo", () => {
    expect(getFlyIaFollowUpPrompts("**Próximo voo**\nData e hora: 26/04 às 22:05")).toEqual([
      "Quais são os detalhes do próximo voo?",
      "Há algum voo cancelado ou remarcado?",
      "Qual é a distância total planejada?",
    ]);
  });

  it("sugere explorações financeiras após uma resposta de gastos", () => {
    expect(getFlyIaFollowUpPrompts("O gasto em passagens é R$ 1.200.")).toContain(
      "Qual é o orçamento disponível?"
    );
  });

  it("mantém sugestões gerais quando não há categoria específica", () => {
    expect(getFlyIaFollowUpPrompts("Posso ajudar com seu planejamento.")).toContain(
      "Qual é meu próximo voo?"
    );
  });

  it("sugere explorações de rota após uma resposta de distância", () => {
    expect(getFlyIaFollowUpPrompts("A distância total planejada é de 12.450 km.")).toEqual([
      "Qual é a distância total planejada?",
      "Quais cidades estão no planejamento?",
      "Qual é meu próximo voo?",
    ]);
  });

  it("sugere perguntas meteorológicas após uma resposta sobre clima", () => {
    expect(getFlyIaFollowUpPrompts("**Previsão no destino**\nCondição: Chuva fraca.")).toEqual([
      "Vai chover quando eu chegar?",
      "Como estará o clima da volta?",
      "O que devo levar na mala para o destino?",
    ]);
  });

  it("prioriza o tema escolhido na sessão sem retirar sugestões de outros temas", () => {
    const preferences = recordFlyIaSuggestionPreference({}, "Há algum voo cancelado ou remarcado?");
    expect(getFlyIaFollowUpPrompts("Seu próximo voo sai às 22:05.", preferences)).toEqual([
      "Há algum voo cancelado ou remarcado?",
      "Quais são os detalhes do próximo voo?",
      "Qual é a distância total planejada?",
    ]);
  });

  it("permite redefinir somente um tema e identificar o interesse dominante", () => {
    const preferences = recordFlyIaSuggestionPreference(
      recordFlyIaSuggestionPreference({}, "Há algum voo cancelado ou remarcado?"),
      "Há algum voo cancelado ou remarcado?"
    );
    const withDistance = recordFlyIaSuggestionPreference(preferences, "Qual é a distância total planejada?");

    expect(getFlyIaDominantSuggestionTopic(withDistance)).toBe("alert");
    expect(clearFlyIaSuggestionTopic(withDistance, "alert")).toEqual({ distance: 1 });
  });

  it("limita a quantidade configurada e explora temas distintos", () => {
    expect(getFlyIaFollowUpPrompts("O gasto em passagens é R$ 1.200.", {}, "affinity", 2)).toHaveLength(2);
    expect(getFlyIaFollowUpPrompts("O gasto em passagens é R$ 1.200.", {}, "explore", 3)).toEqual([
      "Quanto já foi gasto em passagens?",
      "Qual é meu próximo voo?",
      "Há algum voo cancelado ou remarcado?",
    ]);
  });
});
