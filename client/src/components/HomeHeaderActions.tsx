import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { GlobalYearSelector } from "@/components/GlobalYearSelector";
import { MobileLongPressHint } from "@/components/MobileLongPressHint";
import { triggerHaptic } from "@/lib/haptics";
import { getMobilePrimaryActionMeta, type MobilePrimaryAction } from "@/lib/mobileExperience";
import type { NavyIntensity } from "@/contexts/ThemeContext";
import {
  BarChart2,
  Bell,
  BellOff,
  BellRing,
  CalendarDays,
  CircleUserRound,
  DollarSign,
  Eye,
  EyeOff,
  LogIn,
  LogOut,
  MapPinned,
  Moon,
  MoreHorizontal,
  Palette,
  ShieldCheck,
  SlidersHorizontal,
  Sparkles,
  Sun,
  Ticket,
  TrendingUp,
} from "lucide-react";
import React, { type ReactNode } from "react";
import { Link, useLocation } from "wouter";

type ColorPresetOption = {
  name: string;
};

type HomeHeaderActionsProps = {
  selectedYear: number;
  theme: string;
  colorPreset: string;
  colorPresetOptions: Record<string, ColorPresetOption>;
  navyIntensity?: NavyIntensity;
  hideValues: boolean;
  pushStatus: string;
  pushSubscribed: boolean;
  pushLoading: boolean;
  isAuthenticated: boolean;
  isAdmin: boolean;
  accountEmail?: string | null;
  notificationSettings?: ReactNode;
  pdfExport: ReactNode;
  onShowChart: () => void;
  onToggleTheme: () => void;
  onColorPresetChange: (value: string) => void;
  onNavyIntensityChange?: (intensity: NavyIntensity) => void;
  onToggleValues: () => void;
  onToggleNotifications: () => void;
  onSignIn: () => void;
  onSignOut: () => void;
  mobilePrimaryAction?: MobilePrimaryAction;
  onMobilePrimaryActionChange?: (action: MobilePrimaryAction) => void;
};

const headerButtonClass =
  "h-10 rounded-xl border border-white/35 bg-slate-950/20 px-3 text-white shadow-sm backdrop-blur-md transition-[transform,background-color,border-color] duration-150 hover:border-white/70 hover:bg-white/18 active:scale-[0.97] focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-slate-800";

const iconButtonClass = `${headerButtonClass} w-10 px-0`;

const menuContentClass =
  "w-[min(18rem,calc(100vw-2rem))] rounded-xl border-white/15 bg-slate-950/95 p-1.5 text-white shadow-2xl backdrop-blur-xl";

type ViewTransitionDocument = Document & {
  startViewTransition?: (callback: () => void) => {
    finished?: Promise<unknown>;
  };
};

type HeaderTransitionDestination = "calendar" | "passages" | "financial";

/**
 * Organiza as ações da página inicial em três níveis: contexto e ação primária,
 * navegação secundária e preferências/conta. Em telas estreitas, os grupos têm
 * largura previsível e não dependem de quebra arbitrária de botões.
 */
export function HomeHeaderActions({
  selectedYear,
  theme,
  colorPreset,
  colorPresetOptions,
  navyIntensity = "standard",
  hideValues,
  pushStatus,
  pushSubscribed,
  pushLoading,
  isAuthenticated,
  isAdmin,
  accountEmail,
  notificationSettings,
  pdfExport,
  onShowChart,
  onToggleTheme,
  onColorPresetChange,
  onNavyIntensityChange = () => {},
  onToggleValues,
  onToggleNotifications,
  onSignIn,
  onSignOut,
  mobilePrimaryAction = "calendar",
  onMobilePrimaryActionChange = () => {},
}: HomeHeaderActionsProps) {
  const [, setLocation] = useLocation();
  const [navigatingDestination, setNavigatingDestination] =
    React.useState<HeaderTransitionDestination | null>(null);
  const notificationsAvailable = pushStatus !== "unsupported";
  const notificationsBlocked = pushStatus === "denied";
  const notificationLabel = pushLoading
    ? "Atualizando notificações"
    : notificationsBlocked
      ? "Notificações bloqueadas"
      : pushSubscribed
        ? "Desativar notificações"
        : "Ativar notificações";
  const primaryMeta = getMobilePrimaryActionMeta(mobilePrimaryAction);
  const navigateWithTransition = (
    event: React.MouseEvent<HTMLAnchorElement>,
    destination: HeaderTransitionDestination,
    href: string
  ) => {
    event.preventDefault();
    triggerHaptic();

    const navigate = () => setLocation(href);
    const shouldReduceMotion = window.matchMedia?.("(prefers-reduced-motion: reduce)")?.matches;
    const transitionDocument = document as ViewTransitionDocument;

    if (shouldReduceMotion || !transitionDocument.startViewTransition) {
      navigate();
      return;
    }

    setNavigatingDestination(destination);
    const transition = transitionDocument.startViewTransition(navigate);
    void Promise.resolve(transition.finished).finally(() =>
      setNavigatingDestination(current =>
        current === destination ? null : current
      )
    );
  };

  return (
    <div
      className="flex w-full flex-col gap-2 lg:w-auto lg:items-end"
      aria-label="Ações do planejamento"
    >
      <div className="flex w-full flex-nowrap items-center gap-1 sm:gap-2 lg:w-auto lg:justify-end">
        <div className="flex min-w-0 flex-1 items-center gap-1 sm:flex-none sm:gap-2">
          <GlobalYearSelector
            className={`${headerButtonClass} min-w-[104px] bg-slate-950/20 text-white hover:bg-white/18`}
          />
          <MobileLongPressHint label={primaryMeta.label}>
            <Link
              href={primaryMeta.href}
              aria-label={primaryMeta.label}
              data-mobile-primary-action={mobilePrimaryAction}
              data-calendar-navigation={mobilePrimaryAction === "calendar" || undefined}
              data-view-transition-destination={mobilePrimaryAction === "calendar" ? "calendar" : "passages"}
              aria-busy={navigatingDestination === (mobilePrimaryAction === "calendar" ? "calendar" : "passages") || undefined}
              onClick={event => navigateWithTransition(
                event,
                mobilePrimaryAction === "calendar" ? "calendar" : "passages",
                primaryMeta.href
              )}
              className={`order-first inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white px-0 font-semibold text-slate-900 shadow-sm transition-[transform,background-color,opacity] duration-150 hover:bg-slate-100 active:scale-[0.97] focus:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-slate-800 sm:w-auto sm:px-3 ${
                navigatingDestination === (mobilePrimaryAction === "calendar" ? "calendar" : "passages") ? "scale-[0.98] opacity-80" : ""
              }`}
            >
              {mobilePrimaryAction === "calendar" ? <CalendarDays className="size-4" aria-hidden="true" /> : <Ticket className="size-4" aria-hidden="true" />}
              <span className="ml-1.5 hidden whitespace-nowrap sm:inline">{mobilePrimaryAction === "calendar" ? "Calendário" : "Gestão"}</span>
            </Link>
          </MobileLongPressHint>
          <MobileLongPressHint label={mobilePrimaryAction === "calendar" ? "Gestão de Passagens" : "Calendário"}>
            <Link
              href={mobilePrimaryAction === "calendar" ? "/gestao-passagens" : "/calendar"}
              aria-label={mobilePrimaryAction === "calendar" ? "Abrir Gestão de Passagens" : "Calendário"}
              data-calendar-navigation={mobilePrimaryAction === "passages" || undefined}
              data-view-transition-destination={mobilePrimaryAction === "calendar" ? "passages" : "calendar"}
              aria-busy={navigatingDestination === (mobilePrimaryAction === "calendar" ? "passages" : "calendar") || undefined}
              onClick={event => navigateWithTransition(
                event,
                mobilePrimaryAction === "calendar" ? "passages" : "calendar",
                mobilePrimaryAction === "calendar" ? "/gestao-passagens" : "/calendar"
              )}
              className={`${headerButtonClass} inline-flex h-10 w-10 shrink-0 items-center justify-center whitespace-nowrap px-0 sm:w-auto sm:min-w-[6.75rem] sm:px-3 ${
                navigatingDestination === (mobilePrimaryAction === "calendar" ? "passages" : "calendar") ? "scale-[0.98] opacity-80" : ""
              }`}
            >
              {mobilePrimaryAction === "calendar" ? <Ticket className="size-4" aria-hidden="true" /> : <CalendarDays className="size-4" aria-hidden="true" />}
              <span className="ml-1.5 hidden whitespace-nowrap sm:inline">{mobilePrimaryAction === "calendar" ? "Gestão" : "Calendário"}</span>
            </Link>
          </MobileLongPressHint>
        </div>

        <div className="flex shrink-0 items-center gap-1 sm:gap-2">
          <MobileLongPressHint label="Mais opções">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                size="sm"
                variant="outline"
                className={iconButtonClass}
                aria-label="Abrir navegação"
              >
                <MoreHorizontal className="size-5" aria-hidden="true" />
                <span className="sr-only">Abrir navegação</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className={menuContentClass}>
              <DropdownMenuLabel className="px-2 py-2 text-xs font-semibold uppercase tracking-[0.14em] text-slate-400">
                Planejamento
              </DropdownMenuLabel>
              <DropdownMenuItem asChild>
                <Link
                  href="/calendar"
                  data-view-transition-destination="calendar"
                  onClick={event => navigateWithTransition(event, "calendar", "/calendar")}
                >
                  <span className="flex items-center gap-2"><Sparkles className="size-4 text-cyan-300" />Calendário</span>
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link
                  href="/gestao-passagens"
                  data-view-transition-destination="passages"
                  onClick={event => navigateWithTransition(event, "passages", "/gestao-passagens")}
                >
                  <span className="flex items-center gap-2"><Ticket className="size-4 text-blue-300" />Gestão de Passagens</span>
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem onSelect={onShowChart}>
                <TrendingUp className="size-4 text-sky-300" />Gráfico
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link href="/cotacoes">
                  <span className="flex items-center gap-2"><DollarSign className="size-4 text-emerald-300" />Cotações</span>
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link
                  href="/financeiro"
                  data-view-transition-destination="financial"
                  onClick={event => navigateWithTransition(event, "financial", "/financeiro")}
                >
                  <span className="flex items-center gap-2"><BarChart2 className="size-4 text-violet-300" />Financeiro</span>
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link href={`/memorias?ano=${selectedYear}`}>
                  <span className="flex items-center gap-2"><Sparkles className="size-4 text-fuchsia-300" />Memórias</span>
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link href="/novidades">
                  <span className="flex items-center gap-2"><Sparkles className="size-4 text-amber-300" />Novidades</span>
                </Link>
              </DropdownMenuItem>
              <DropdownMenuSeparator className="bg-white/10" />
              <DropdownMenuLabel className="px-2 py-2 text-xs font-semibold uppercase tracking-[0.14em] text-slate-400">
                Recursos
              </DropdownMenuLabel>
              <div className="px-1 py-0.5">{pdfExport}</div>
              {isAuthenticated && (
                <DropdownMenuItem asChild>
                  <Link href="/admin/notifications">
                    <span className="flex items-center gap-2"><ShieldCheck className="size-4 text-blue-300" />Painel de avisos</span>
                  </Link>
                </DropdownMenuItem>
              )}
              {isAdmin && (
                <>
                  <DropdownMenuItem asChild>
                    <Link href="/admin/telemetria">
                      <span className="flex items-center gap-2"><MapPinned className="size-4 text-blue-300" />Locais de Acesso</span>
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link href="/admin/gemini">
                      <span className="flex items-center gap-2"><Sparkles className="size-4 text-cyan-300" />Uso de IA</span>
                    </Link>
                  </DropdownMenuItem>
                </>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
          </MobileLongPressHint>

          {isAuthenticated ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  size="sm"
                  variant="outline"
                  className={iconButtonClass}
                  aria-label="Abrir conta"
                >
                  <CircleUserRound className="size-5" aria-hidden="true" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className={menuContentClass}>
                <DropdownMenuLabel className="max-w-[16rem] truncate px-2 py-2 text-sm font-medium text-slate-200">
                  {accountEmail || "Conta conectada"}
                </DropdownMenuLabel>
                <DropdownMenuSeparator className="bg-white/10" />
                <DropdownMenuItem onSelect={onSignOut} className="text-red-300 focus:text-red-200">
                  <LogOut className="size-4" />Sair
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <MobileLongPressHint label="Entrar">
              <Button
                size="sm"
                variant="outline"
                className={`${iconButtonClass} shrink-0 sm:w-auto sm:px-3`}
                onClick={onSignIn}
              >
                <LogIn className="size-4" aria-hidden="true" />
                <span className="ml-1.5 hidden sm:inline">Entrar</span>
              </Button>
            </MobileLongPressHint>
          )}
        </div>
      </div>

      <div className="flex w-full sm:hidden">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <MobileLongPressHint label="Preferências">
              <Button
                size="sm"
                variant="outline"
                className={`${iconButtonClass} w-full justify-center`}
                aria-label="Abrir preferências"
              >
                <SlidersHorizontal className="size-4" aria-hidden="true" />
                <span className="ml-1.5 text-sm">Preferências</span>
              </Button>
            </MobileLongPressHint>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className={menuContentClass}>
            <DropdownMenuLabel className="px-2 py-2 text-xs font-semibold uppercase tracking-[0.14em] text-slate-400">
              Ação prioritária
            </DropdownMenuLabel>
            <DropdownMenuRadioGroup
              value={mobilePrimaryAction}
              onValueChange={value => onMobilePrimaryActionChange(value as MobilePrimaryAction)}
            >
              <DropdownMenuRadioItem value="calendar">Calendário</DropdownMenuRadioItem>
              <DropdownMenuRadioItem value="passages">Gestão de Passagens</DropdownMenuRadioItem>
            </DropdownMenuRadioGroup>
            <DropdownMenuSeparator className="bg-white/10" />
            <DropdownMenuItem onSelect={onToggleTheme}>
              {theme === "dark" ? <Sun className="size-4" /> : <Moon className="size-4" />}
              {theme === "dark" ? "Usar modo claro" : "Usar modo escuro"}
            </DropdownMenuItem>
            <DropdownMenuItem onSelect={onToggleValues}>
              {hideValues ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
              {hideValues ? "Exibir valores" : "Ocultar valores"}
            </DropdownMenuItem>
            {notificationsAvailable && (
              <DropdownMenuItem
                disabled={pushLoading || notificationsBlocked}
                onSelect={onToggleNotifications}
              >
                {pushSubscribed ? <BellRing className="size-4" /> : <Bell className="size-4" />}
                {notificationLabel}
              </DropdownMenuItem>
            )}
            <DropdownMenuSeparator className="bg-white/10" />
            <DropdownMenuLabel className="px-2 py-2 text-xs font-semibold uppercase tracking-[0.14em] text-slate-400">
              Cor da interface
            </DropdownMenuLabel>
            <DropdownMenuRadioGroup value={colorPreset} onValueChange={onColorPresetChange}>
              {Object.entries(colorPresetOptions).map(([key, preset]) => (
                <DropdownMenuRadioItem key={key} value={key}>
                  {preset.name}
                </DropdownMenuRadioItem>
              ))}
            </DropdownMenuRadioGroup>
            <DropdownMenuSeparator className="bg-white/10" />
            <DropdownMenuLabel className="px-2 py-2 text-xs font-semibold uppercase tracking-[0.14em] text-slate-400">
              Intensidade azul-marinho
            </DropdownMenuLabel>
            <DropdownMenuRadioGroup value={navyIntensity} onValueChange={value => onNavyIntensityChange(value as NavyIntensity)}>
              <DropdownMenuRadioItem value="standard">Equilibrado</DropdownMenuRadioItem>
              <DropdownMenuRadioItem value="intense">Intenso</DropdownMenuRadioItem>
            </DropdownMenuRadioGroup>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <div className="hidden w-full sm:flex sm:flex-nowrap sm:items-center sm:gap-2 lg:w-auto lg:justify-end">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              size="sm"
              variant="outline"
              className={iconButtonClass}
              aria-label="Abrir preferências de aparência"
              title="Aparência"
            >
              <Palette className="size-4" aria-hidden="true" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className={menuContentClass}>
            <DropdownMenuItem onSelect={onToggleTheme}>
              {theme === "dark" ? <Sun className="size-4" /> : <Moon className="size-4" />}
              {theme === "dark" ? "Usar modo claro" : "Usar modo escuro"}
            </DropdownMenuItem>
            <DropdownMenuSeparator className="bg-white/10" />
            <DropdownMenuLabel className="px-2 py-2 text-xs font-semibold uppercase tracking-[0.14em] text-slate-400">
              Cor da interface
            </DropdownMenuLabel>
            <DropdownMenuRadioGroup value={colorPreset} onValueChange={onColorPresetChange}>
              {Object.entries(colorPresetOptions).map(([key, preset]) => (
                <DropdownMenuRadioItem key={key} value={key}>
                  {preset.name}
                </DropdownMenuRadioItem>
              ))}
            </DropdownMenuRadioGroup>
            <DropdownMenuSeparator className="bg-white/10" />
            <DropdownMenuLabel className="px-2 py-2 text-xs font-semibold uppercase tracking-[0.14em] text-slate-400">
              Intensidade azul-marinho
            </DropdownMenuLabel>
            <DropdownMenuRadioGroup value={navyIntensity} onValueChange={value => onNavyIntensityChange(value as NavyIntensity)}>
              <DropdownMenuRadioItem value="standard">Equilibrado</DropdownMenuRadioItem>
              <DropdownMenuRadioItem value="intense">Intenso</DropdownMenuRadioItem>
            </DropdownMenuRadioGroup>
          </DropdownMenuContent>
        </DropdownMenu>

        <Button
          size="sm"
          variant="outline"
          className={`${iconButtonClass} ${hideValues ? "border-white/80 bg-white/25" : ""}`}
          title={hideValues ? "Exibir valores" : "Ocultar valores"}
          aria-label={hideValues ? "Exibir valores" : "Ocultar valores"}
          onClick={onToggleValues}
        >
          {hideValues ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
        </Button>

        {notificationsAvailable && (
          <Button
            size="sm"
            variant="outline"
            className={`${iconButtonClass} ${pushSubscribed ? "border-emerald-200 bg-emerald-500/25" : ""} ${notificationsBlocked ? "border-red-300 bg-red-500/20 opacity-60" : ""}`}
            title={notificationLabel}
            aria-label={notificationLabel}
            disabled={pushLoading || notificationsBlocked}
            onClick={onToggleNotifications}
          >
            {pushLoading ? (
              <span className="size-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
            ) : notificationsBlocked ? (
              <BellOff className="size-4" />
            ) : pushSubscribed ? (
              <BellRing className="size-4" />
            ) : (
              <Bell className="size-4" />
            )}
          </Button>
        )}

        {pushSubscribed && notificationSettings}
      </div>
    </div>
  );
}
