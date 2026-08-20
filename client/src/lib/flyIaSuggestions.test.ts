import { describe, expect, it } from "vitest";
import { getFlyIaFollowUpPrompts } from "./flyIaSuggestions";

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
});
