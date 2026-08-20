import type { HomeExpandablePanels } from "./homeExpandablePanels";

export type HomeGlobalPanelState = {
  summary: boolean;
  filters: boolean;
  expandablePanels: HomeExpandablePanels;
};

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
  state: HomeGlobalPanelState
): HomeGlobalPanelState {
  const nextState = !areAllHomePanelsOpen(state);

  return {
    summary: nextState,
    filters: nextState,
    expandablePanels: {
      annualProgress: nextState,
      attentionCenter: nextState,
      priceVariation: nextState,
    },
  };
}
