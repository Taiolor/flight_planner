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
  Sparkles,
  Sun,
  Ticket,
  TrendingUp,
} from "lucide-react";
import React, { type ReactNode } from "react";
import { Link } from "wouter";

type ColorPresetOption = {
  name: string;
};

type HomeHeaderActionsProps = {
  selectedYear: number;
  theme: string;
  colorPreset: string;
  colorPresetOptions: Record<string, ColorPresetOption>;
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
  onToggleValues: () => void;
  onToggleNotifications: () => void;
  onSignIn: () => void;
  onSignOut: () => void;
};

const headerButtonClass =
  "h-10 rounded-xl border border-white/35 bg-slate-950/20 px-3 text-white shadow-sm backdrop-blur-md transition-[transform,background-color,border-color] duration-150 hover:border-white/70 hover:bg-white/18 active:scale-[0.97] focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-slate-800";

const iconButtonClass = `${headerButtonClass} w-10 px-0`;

const menuContentClass =
  "w-[min(18rem,calc(100vw-2rem))] rounded-xl border-white/15 bg-slate-950/95 p-1.5 text-white shadow-2xl backdrop-blur-xl";

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
  onToggleValues,
  onToggleNotifications,
  onSignIn,
  onSignOut,
}: HomeHeaderActionsProps) {
  const notificationsAvailable = pushStatus !== "unsupported";
  const notificationsBlocked = pushStatus === "denied";
  const notificationLabel = pushLoading
    ? "Atualizando notificações"
    : notificationsBlocked
      ? "Notificações bloqueadas"
      : pushSubscribed
        ? "Desativar notificações"
        : "Ativar notificações";

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
          <Link
            href="/calendar"
            aria-label="Calendário"
            className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white px-0 font-semibold text-slate-900 shadow-sm transition-[transform,background-color] duration-150 hover:bg-slate-100 active:scale-[0.97] focus:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-slate-800 sm:w-auto sm:px-3"
          >
            <CalendarDays className="size-4" aria-hidden="true" />
            <span className="ml-1.5 hidden whitespace-nowrap sm:inline">Calendário</span>
          </Link>
          <Link
            href="/gestao-passagens"
            aria-label="Abrir Gestão de Passagens"
            className={`${iconButtonClass} shrink-0 sm:w-auto sm:px-3`}
          >
            <Ticket className="size-4" aria-hidden="true" />
            <span className="ml-1.5 hidden sm:inline">Gestão</span>
          </Link>
          <Button
            size="sm"
            variant="outline"
            className={`${headerButtonClass} hidden h-10 px-3 sm:inline-flex`}
            onClick={onShowChart}
          >
            <TrendingUp className="size-4" aria-hidden="true" />
            <span className="ml-1.5 hidden sm:inline">Gráfico</span>
          </Button>
        </div>

        <div className="flex shrink-0 items-center gap-1 sm:gap-2">
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
                <Link href="/calendar">
                  <span className="flex items-center gap-2"><Sparkles className="size-4 text-cyan-300" />Calendário</span>
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link href="/gestao-passagens">
                  <span className="flex items-center gap-2"><Ticket className="size-4 text-blue-300" />Gestão de Passagens</span>
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link href="/cotacoes">
                  <span className="flex items-center gap-2"><DollarSign className="size-4 text-emerald-300" />Cotações</span>
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link href="/financeiro">
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
                      <span className="flex items-center gap-2"><MapPinned className="size-4 text-blue-300" />Locais consentidos</span>
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
            <Button
              size="sm"
              variant="outline"
              className={`${iconButtonClass} shrink-0 sm:w-auto sm:px-3`}
              onClick={onSignIn}
            >
              <LogIn className="size-4" aria-hidden="true" />
              <span className="ml-1.5 hidden sm:inline">Entrar</span>
            </Button>
          )}
        </div>
      </div>

      <div className="flex w-full flex-nowrap items-center gap-1 sm:gap-2 lg:w-auto lg:justify-end">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              size="sm"
              variant="outline"
              className={`${iconButtonClass} sm:w-auto sm:px-3`}
              aria-label="Abrir preferências de aparência"
            >
              <Palette className="size-4" aria-hidden="true" />
              <span className="ml-1.5 hidden sm:inline">Aparência</span>
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
