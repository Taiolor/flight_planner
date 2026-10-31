import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const source = readFileSync(
  new URL("./NotificationSettingsPopup.tsx", import.meta.url),
  "utf8"
);

describe("NotificationSettingsPopup — gatilho compacto", () => {
  it("usa somente ícone no cabeçalho e mantém um nome acessível", () => {
    const mobileTrigger = source.slice(
      source.indexOf("const TriggerButton"),
      source.indexOf("// Mobile:")
    );
    const desktopTrigger = source.slice(
      source.indexOf("<PopoverTrigger asChild>"),
      source.indexOf("</PopoverTrigger>")
    );

    expect(mobileTrigger).toContain('<Settings2 className="w-4 h-4" />');
    expect(mobileTrigger).toContain('aria-label="Configurar agendamentos de notificação"');
    expect(mobileTrigger).not.toContain(">Avisos<");
    expect(desktopTrigger).toContain('<Settings2 className="w-4 h-4" />');
    expect(desktopTrigger).toContain('aria-label="Configurar agendamentos de notificação"');
    expect(desktopTrigger).not.toContain(">Avisos<");
  });
});
