import { describe, expect, it } from "vitest";
import {
  getMobilePrimaryActionMeta,
  isMobilePrimaryAction,
  MOBILE_NAVIGATION_ITEMS,
} from "./mobileExperience";

describe("arquitetura de experiência mobile", () => {
  it("define os quatro destinos da barra inferior", () => {
    expect(MOBILE_NAVIGATION_ITEMS.map(item => item.href)).toEqual([
      "/",
      "/calendar",
      "/gestao-passagens",
      "/cotacoes",
    ]);
  });

  it("reconhece e resolve as ações prioritárias disponíveis", () => {
    expect(isMobilePrimaryAction("calendar")).toBe(true);
    expect(isMobilePrimaryAction("passages")).toBe(true);
    expect(isMobilePrimaryAction("quotes")).toBe(false);
    expect(getMobilePrimaryActionMeta("passages")).toEqual({
      href: "/gestao-passagens",
      label: "Gestão de Passagens",
    });
  });
});
