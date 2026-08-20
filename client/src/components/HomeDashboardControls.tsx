import React from "react";
import {
  Bookmark,
  BookmarkCheck,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  ChevronUp,
} from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  HOME_PANEL_PRIORITY_OPTIONS,
  type HomeLayoutProfile,
  type HomePanelMoveDirection,
  type HomePanelId,
} from "@/lib/homeDashboardPreferences";

type HomeDashboardControlsProps = {
  theme: string;
  profile: HomeLayoutProfile;
  pinnedPanels: HomePanelId[];
  allPanelsOpen: boolean;
  onProfileChange: (profile: Exclude<HomeLayoutProfile, "custom">) => void;
  onToggleAll: () => void;
  onTogglePriority: (panel: HomePanelId) => void;
  onMovePriority: (panel: HomePanelId, direction: HomePanelMoveDirection) => void;
};

export function HomeDashboardControls({
  theme,
  profile,
  pinnedPanels,
  allPanelsOpen,
  onProfileChange,
  onToggleAll,
  onTogglePriority,
  onMovePriority,
}: HomeDashboardControlsProps) {
  const isDark = theme === "dark";
  const priorityOptions = [
    ...pinnedPanels
      .map(id => HOME_PANEL_PRIORITY_OPTIONS.find(option => option.id === id))
      .filter((option): option is (typeof HOME_PANEL_PRIORITY_OPTIONS)[number] => Boolean(option)),
    ...HOME_PANEL_PRIORITY_OPTIONS.filter(option => !pinnedPanels.includes(option.id)),
  ];

  return (
    <section
      aria-label="Organização dos quadros"
      className={`mb-4 rounded-2xl border p-3 shadow-sm sm:mb-6 ${
        isDark ? "border-slate-800 bg-slate-900/70" : "border-slate-200 bg-white/80"
      }`}
    >
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex min-w-0 flex-col gap-1 sm:flex-row sm:items-center sm:gap-3">
          <span className={`text-sm font-semibold ${isDark ? "text-slate-200" : "text-slate-700"}`}>
            Layout dos quadros
          </span>
          <Select
            value={profile}
            onValueChange={value => {
              if (value !== "custom") {
                onProfileChange(value as Exclude<HomeLayoutProfile, "custom">);
              }
            }}
          >
            <SelectTrigger aria-label="Selecionar perfil de layout" className="h-10 w-full sm:w-44">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="complete">Completo</SelectItem>
              <SelectItem value="focus">Foco</SelectItem>
              <SelectItem value="compact">Compacto</SelectItem>
              <SelectItem value="custom" disabled>Personalizado</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <button
          type="button"
          onClick={onToggleAll}
          aria-pressed={allPanelsOpen}
          aria-label={allPanelsOpen ? "Recolher todos os quadros" : "Expandir todos os quadros"}
          title="Atalho: Alt + Shift + E"
          className={`inline-flex min-h-10 items-center justify-center gap-2 rounded-xl border px-3 py-2 text-sm font-semibold transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 ${
            isDark
              ? "border-slate-700 bg-slate-800 text-slate-200 hover:bg-slate-700"
              : "border-slate-200 bg-white text-slate-700 shadow-sm hover:bg-slate-50"
          }`}
        >
          {allPanelsOpen ? (
            <ChevronUp className="h-4 w-4" aria-hidden="true" />
          ) : (
            <ChevronDown className="h-4 w-4" aria-hidden="true" />
          )}
          {allPanelsOpen ? "Recolher todos" : "Expandir todos"}
          <kbd className="hidden rounded border border-current/20 px-1.5 py-0.5 text-[10px] font-medium opacity-70 lg:inline">
            Alt + Shift + E
          </kbd>
        </button>
      </div>
      <div className="mt-3 flex flex-col gap-2 border-t border-slate-200/70 pt-3 dark:border-slate-700 sm:flex-row sm:items-center">
          <span className={`text-xs font-semibold uppercase tracking-wide ${isDark ? "text-slate-400" : "text-slate-500"}`}>
          Prioritários
          </span>
          <div className="flex flex-wrap gap-2">
          {priorityOptions.map((option, index) => {
            const isPinned = pinnedPanels.includes(option.id);
            const isFirstPinned = isPinned && index === 0;
            const isLastPinned = isPinned && index === pinnedPanels.length - 1;
            return (
              <div key={option.id} className="inline-flex items-center gap-1">
                <button
                  type="button"
                  aria-pressed={isPinned}
                  onClick={() => onTogglePriority(option.id)}
                  className={`inline-flex min-h-9 items-center gap-1.5 rounded-lg border px-2.5 py-1.5 text-xs font-semibold transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 ${
                    isPinned
                      ? "border-blue-300 bg-blue-50 text-blue-700 dark:border-blue-700 dark:bg-blue-950/50 dark:text-blue-200"
                      : isDark
                        ? "border-slate-700 text-slate-300 hover:bg-slate-800"
                        : "border-slate-200 text-slate-600 hover:bg-slate-50"
                  }`}
                >
                  {isPinned ? <BookmarkCheck className="h-3.5 w-3.5" /> : <Bookmark className="h-3.5 w-3.5" />}
                  {option.label}
                </button>
                {isPinned && (
                  <span className="inline-flex overflow-hidden rounded-lg border border-slate-200 dark:border-slate-700">
                    <button
                      type="button"
                      aria-label={`Mover ${option.label} para a esquerda`}
                      disabled={isFirstPinned}
                      onClick={() => onMovePriority(option.id, "previous")}
                      className="flex h-9 w-8 items-center justify-center border-r border-slate-200 text-slate-500 transition-colors hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-35 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
                    >
                      <ChevronLeft className="h-3.5 w-3.5" aria-hidden="true" />
                    </button>
                    <button
                      type="button"
                      aria-label={`Mover ${option.label} para a direita`}
                      disabled={isLastPinned}
                      onClick={() => onMovePriority(option.id, "next")}
                      className="flex h-9 w-8 items-center justify-center text-slate-500 transition-colors hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-35 dark:text-slate-300 dark:hover:bg-slate-800"
                    >
                      <ChevronRight className="h-3.5 w-3.5" aria-hidden="true" />
                    </button>
                  </span>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
