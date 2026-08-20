import type { HomeExpandablePanels } from "./homeExpandablePanels";

export const HOME_DASHBOARD_PREFERENCES_STORAGE_KEY =
  "viagens.home.dashboard-preferences.v1";

export type HomePanelId =
  | "summary"
  | "filters"
  | "annualProgress"
  | "attentionCenter"
  | "priceVariation";

export type HomeLayoutProfile = "complete" | "focus" | "compact" | "custom";

export type HomeGlobalPanelState = {
  summary: boolean;
  filters: boolean;
  expandablePanels: HomeExpandablePanels;
};

export type HomeDashboardPreferences = {
  profile: HomeLayoutProfile;
  pinnedPanels: HomePanelId[];
};

export const HOME_PANEL_PRIORITY_OPTIONS: ReadonlyArray<{
  id: HomePanelId;
  label: string;
}> = [
  { id: "summary", label: "Resumo" },
  { id: "filters", label: "Filtros" },
  { id: "annualProgress", label: "Progresso" },
  { id: "attentionCenter", label: "Atenção" },
  { id: "priceVariation", label: "Preços" },
];

export const DEFAULT_HOME_DASHBOARD_PREFERENCES: HomeDashboardPreferences = {
  profile: "complete",
  pinnedPanels: [],
};

const panelIds = new Set<HomePanelId>(
  HOME_PANEL_PRIORITY_OPTIONS.map(option => option.id)
);

export function readHomeDashboardPreferences(
  storage: Pick<Storage, "getItem"> | null =
    typeof window === "undefined" ? null : window.localStorage
): HomeDashboardPreferences {
  if (!storage) return DEFAULT_HOME_DASHBOARD_PREFERENCES;

  try {
    const raw = storage.getItem(HOME_DASHBOARD_PREFERENCES_STORAGE_KEY);
    if (!raw) return DEFAULT_HOME_DASHBOARD_PREFERENCES;
    const parsed = JSON.parse(raw) as Partial<HomeDashboardPreferences>;
    const profile: HomeLayoutProfile =
      parsed.profile === "focus" ||
      parsed.profile === "compact" ||
      parsed.profile === "custom"
        ? parsed.profile
        : "complete";
    const pinnedPanels = Array.isArray(parsed.pinnedPanels)
      ? [...new Set(parsed.pinnedPanels.filter((panel): panel is HomePanelId => panelIds.has(panel as HomePanelId)))]
      : [];

    return { profile, pinnedPanels };
  } catch {
    return DEFAULT_HOME_DASHBOARD_PREFERENCES;
  }
}

export function persistHomeDashboardPreferences(
  preferences: HomeDashboardPreferences,
  storage: Pick<Storage, "setItem"> | null =
    typeof window === "undefined" ? null : window.localStorage
) {
  storage?.setItem(
    HOME_DASHBOARD_PREFERENCES_STORAGE_KEY,
    JSON.stringify(preferences)
  );
}

export function getHomeLayoutProfileState(
  profile: Exclude<HomeLayoutProfile, "custom">
): HomeGlobalPanelState {
  if (profile === "focus") {
    return {
      summary: true,
      filters: false,
      expandablePanels: {
        annualProgress: true,
        attentionCenter: false,
        priceVariation: false,
      },
    };
  }

  const isOpen = profile === "complete";
  return {
    summary: isOpen,
    filters: isOpen,
    expandablePanels: {
      annualProgress: isOpen,
      attentionCenter: isOpen,
      priceVariation: isOpen,
    },
  };
}

export function applyPinnedPanels(
  state: HomeGlobalPanelState,
  pinnedPanels: HomePanelId[]
): HomeGlobalPanelState {
  const next: HomeGlobalPanelState = {
    summary: state.summary,
    filters: state.filters,
    expandablePanels: { ...state.expandablePanels },
  };

  for (const panel of pinnedPanels) {
    if (panel === "summary") next.summary = true;
    else if (panel === "filters") next.filters = true;
    else next.expandablePanels[panel] = true;
  }

  return next;
}
