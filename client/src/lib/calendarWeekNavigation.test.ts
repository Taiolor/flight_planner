import { describe, expect, it } from "vitest";
import { getCalendarWeekFromLocation } from "./calendarWeekNavigation";

describe("navegação contextual do Calendário", () => {
  it("lê uma semana válida da URL e ignora valores inválidos", () => {
    expect(getCalendarWeekFromLocation("/calendar?week=18")).toBe(18);
    expect(getCalendarWeekFromLocation("/calendar?week=0")).toBeNull();
    expect(getCalendarWeekFromLocation("/calendar?week=invalida")).toBeNull();
  });
});
