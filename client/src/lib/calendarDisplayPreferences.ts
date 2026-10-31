export const CALENDAR_DISPLAY_PREFERENCES_STORAGE_KEY =
  "smartfly.calendar.display-preferences.v1";

export type CalendarDisplayPreferences = {
  highContrast: boolean;
  secondaryFiltersExpanded: boolean;
};

const DEFAULT_PREFERENCES: CalendarDisplayPreferences = {
  highContrast: false,
  secondaryFiltersExpanded: false,
};

export function readCalendarDisplayPreferences(
  storage: Pick<Storage, "getItem"> | null =
    typeof window === "undefined" ? null : window.localStorage
): CalendarDisplayPreferences {
  const raw = storage?.getItem(CALENDAR_DISPLAY_PREFERENCES_STORAGE_KEY);
  if (!raw) return DEFAULT_PREFERENCES;

  try {
    const parsed: unknown = JSON.parse(raw);
    if (!parsed || typeof parsed !== "object") return DEFAULT_PREFERENCES;

    const values = parsed as Partial<CalendarDisplayPreferences>;
    return {
      highContrast:
        typeof values.highContrast === "boolean"
          ? values.highContrast
          : DEFAULT_PREFERENCES.highContrast,
      secondaryFiltersExpanded:
        typeof values.secondaryFiltersExpanded === "boolean"
          ? values.secondaryFiltersExpanded
          : DEFAULT_PREFERENCES.secondaryFiltersExpanded,
    };
  } catch {
    return DEFAULT_PREFERENCES;
  }
}

export function saveCalendarDisplayPreferences(
  preferences: CalendarDisplayPreferences,
  storage: Pick<Storage, "setItem"> | null =
    typeof window === "undefined" ? null : window.localStorage
) {
  storage?.setItem(
    CALENDAR_DISPLAY_PREFERENCES_STORAGE_KEY,
    JSON.stringify(preferences)
  );
}
