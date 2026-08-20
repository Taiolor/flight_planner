import type { HomeGlobalPanelState, HomePanelId } from "./homeDashboardPreferences";

export function areAllHomePanelsOpen(state: HomeGlobalPanelState): boolean {
  return (
    state.summary &&
    state.filters &&
    state.expandablePanels.annualProgress &&
    state.expandablePanels.attentionCenter &&
    state.expandablePanels.priceVariation
  );
}

export function getNextHomeGlobalPanelState(
  state: HomeGlobalPanelState,
  pinnedPanels: HomePanelId[] = []
): HomeGlobalPanelState {
  const nextState = !areAllHomePanelsOpen(state);

  const next = {
    summary: nextState,
    filters: nextState,
    expandablePanels: {
      annualProgress: nextState,
      attentionCenter: nextState,
      priceVariation: nextState,
    },
  };

  for (const panel of pinnedPanels) {
    if (panel === "summary") next.summary = true;
    else if (panel === "filters") next.filters = true;
    else next.expandablePanels[panel] = true;
  }

  return next;
}
