import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

describe("confirmação visual ao salvar dados do bilhete", () => {
  const source = readFileSync("client/src/pages/Home.tsx", "utf8");

  it("mantém uma confirmação transitória e acessível para cada semana salva", () => {
    expect(source).toContain("const [savedTicket, setSavedTicket]");
    expect(source).toContain("showTicketSaveSuccess(");
    expect(source).toContain("role=\"status\"");
    expect(source).toContain("Alterações da semana {week.weekNumber} registradas.");
    expect(source).toContain("Dados salvos");
  });

  it("limpa o feedback ao iniciar um novo salvamento e respeita redução de movimento", () => {
    expect(source).toContain("[week.weekNumber]: false");
    expect(source).toContain("motion-reduce:animate-none");
    expect(source).toContain("4_500");
  });
});
