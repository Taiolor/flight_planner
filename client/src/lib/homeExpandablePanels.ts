export const HOME_EXPANDABLE_PANELS_STORAGE_KEY =
  "viagens.home.expandable-panels.v1";

export type HomeExpandablePanels = {
  annualProgress: boolean;
  attentionCenter: boolean;
};

export const DEFAULT_HOME_EXPANDABLE_PANELS: HomeExpandablePanels = {
  annualProgress: true,
  attentionCenter: true,
};

export function readHomeExpandablePanels(
  storage: Pick<Storage, "getItem"> | null =
    typeof window === "undefined" ? null : window.localStorage
): HomeExpandablePanels {
  if (!storage) return DEFAULT_HOME_EXPANDABLE_PANELS;
  try {
    const raw = storage.getItem(HOME_EXPANDABLE_PANELS_STORAGE_KEY);
    if (!raw) return DEFAULT_HOME_EXPANDABLE_PANELS;
    const parsed = JSON.parse(raw) as Partial<HomeExpandablePanels>;
    return {
      annualProgress:
        typeof parsed.annualProgress === "boolean"
          ? parsed.annualProgress
          : DEFAULT_HOME_EXPANDABLE_PANELS.annualProgress,
      attentionCenter:
        typeof parsed.attentionCenter === "boolean"
          ? parsed.attentionCenter
          : DEFAULT_HOME_EXPANDABLE_PANELS.attentionCenter,
    };
  } catch {
    return DEFAULT_HOME_EXPANDABLE_PANELS;
  }
}

export function persistHomeExpandablePanels(
  panels: HomeExpandablePanels,
  storage: Pick<Storage, "setItem"> | null =
    typeof window === "undefined" ? null : window.localStorage
) {
  storage?.setItem(HOME_EXPANDABLE_PANELS_STORAGE_KEY, JSON.stringify(panels));
}
