export type MobilePrimaryAction = "calendar" | "passages";

export const MOBILE_NAVIGATION_ITEMS = [
  { href: "/", label: "Início", icon: "home" },
  { href: "/calendar", label: "Calendário", icon: "calendar" },
  { href: "/gestao-passagens", label: "Gestão", icon: "ticket" },
  { href: "/cotacoes", label: "Cotações", icon: "chart" },
] as const;

export function isMobilePrimaryAction(value: unknown): value is MobilePrimaryAction {
  return value === "calendar" || value === "passages";
}

export function getMobilePrimaryActionMeta(action: MobilePrimaryAction) {
  return action === "calendar"
    ? { href: "/calendar", label: "Calendário" }
    : { href: "/gestao-passagens", label: "Gestão de Passagens" };
}
