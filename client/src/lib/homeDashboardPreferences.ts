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
export type HomePanelMoveDirection = "previous" | "next";
export type HomePrioritySet = {
  id: string;
  name: string;
  pinnedPanels: HomePanelId[];
};

export type HomeGlobalPanelState = {
  summary: boolean;
  filters: boolean;
  expandablePanels: HomeExpandablePanels;
};

export type HomeDashboardPreferences = {
  profile: HomeLayoutProfile;
  pinnedPanels: HomePanelId[];
  prioritySets: HomePrioritySet[];
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
  prioritySets: [],
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
    const pinnedPanels = sanitizePinnedPanels(parsed.pinnedPanels);
    const prioritySets = Array.isArray(parsed.prioritySets)
      ? parsed.prioritySets
          .map(set => sanitizePrioritySet(set))
          .filter((set): set is HomePrioritySet => Boolean(set))
          .slice(0, 8)
      : [];

    return { profile, pinnedPanels, prioritySets };
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

export function reorderPinnedPanels(
  pinnedPanels: HomePanelId[],
  panel: HomePanelId,
  direction: HomePanelMoveDirection
): HomePanelId[] {
  const index = pinnedPanels.indexOf(panel);
  const targetIndex = direction === "previous" ? index - 1 : index + 1;

  if (index < 0 || targetIndex < 0 || targetIndex >= pinnedPanels.length) {
    return pinnedPanels;
  }

  const next = [...pinnedPanels];
  [next[index], next[targetIndex]] = [next[targetIndex], next[index]];
  return next;
}

export function reorderPinnedPanelsByDrop(
  pinnedPanels: HomePanelId[],
  sourcePanel: HomePanelId,
  targetPanel: HomePanelId
): HomePanelId[] {
  const sourceIndex = pinnedPanels.indexOf(sourcePanel);
  const targetIndex = pinnedPanels.indexOf(targetPanel);
  if (sourceIndex < 0 || targetIndex < 0 || sourceIndex === targetIndex) {
    return pinnedPanels;
  }

  const next = [...pinnedPanels];
  next.splice(sourceIndex, 1);
  next.splice(targetIndex, 0, sourcePanel);
  return next;
}

export function restoreDefaultPinnedOrder(pinnedPanels: HomePanelId[]): HomePanelId[] {
  return HOME_PANEL_PRIORITY_OPTIONS
    .map(option => option.id)
    .filter(panel => pinnedPanels.includes(panel));
}

export function upsertHomePrioritySet(
  prioritySets: HomePrioritySet[],
  name: string,
  pinnedPanels: HomePanelId[]
): HomePrioritySet[] {
  const normalizedName = name.trim().slice(0, 40);
  if (!normalizedName) return prioritySets;
  const id = `set-${normalizedName
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "")}`;
  const nextSet: HomePrioritySet = {
    id,
    name: normalizedName,
    pinnedPanels: sanitizePinnedPanels(pinnedPanels),
  };
  const index = prioritySets.findIndex(set => set.id === id);
  if (index < 0) return [...prioritySets, nextSet].slice(0, 8);

  const next = [...prioritySets];
  next[index] = nextSet;
  return next;
}

export function deleteHomePrioritySet(
  prioritySets: HomePrioritySet[],
  setId: string
): HomePrioritySet[] {
  return prioritySets.filter(set => set.id !== setId);
}

function sanitizePinnedPanels(value: unknown): HomePanelId[] {
  return Array.isArray(value)
    ? [...new Set(value.filter((panel): panel is HomePanelId => panelIds.has(panel as HomePanelId)))]
    : [];
}

function sanitizePrioritySet(value: unknown): HomePrioritySet | null {
  if (!value || typeof value !== "object") return null;
  const candidate = value as Partial<HomePrioritySet>;
  if (typeof candidate.id !== "string" || typeof candidate.name !== "string") return null;
  const name = candidate.name.trim().slice(0, 40);
  if (!name) return null;
  return {
    id: candidate.id.slice(0, 80),
    name,
    pinnedPanels: sanitizePinnedPanels(candidate.pinnedPanels),
  };
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
