import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

describe("App mobile navigation layout", () => {
  const appSource = readFileSync(resolve(process.cwd(), "client/src/App.tsx"), "utf8");
  const navigationSource = readFileSync(
    resolve(process.cwd(), "client/src/components/MobileBottomNavigation.tsx"),
    "utf8"
  );

  it("reserva espaço para a barra inferior apenas no mobile e a oculta a partir de sm", () => {
    expect(appSource).toContain('<div className="pb-24 sm:pb-0">');
    expect(appSource).toContain("<MobileBottomNavigation />");
    expect(navigationSource).toContain("fixed inset-x-3 bottom-3 z-40");
    expect(navigationSource).toContain("sm:hidden");
  });

  it("mantém destinos acessíveis para uso com uma mão", () => {
    expect(navigationSource).toContain('aria-label="Navegação principal mobile"');
    expect(navigationSource).toContain("grid-cols-5");
    expect(navigationSource).toContain('aria-label="Mais opções de navegação"');
    expect(navigationSource).toContain("min-h-12");
    expect(navigationSource).toContain("aria-current={isActive ? \"page\" : undefined}");
    expect(navigationSource).toContain("focus-visible:ring-2");
  });
});
