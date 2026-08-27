import React from "react";
import { BarChart3, Bell, CalendarDays, House, MapPinned, Menu, Sparkles, Ticket } from "lucide-react";
import { Link, useLocation } from "wouter";
import { triggerHaptic } from "@/lib/haptics";
import { MOBILE_NAVIGATION_ITEMS } from "@/lib/mobileExperience";
import { trpc } from "@/lib/trpc";
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";

const icons = {
  home: House,
  calendar: CalendarDays,
  ticket: Ticket,
  chart: BarChart3,
} as const;

/** Navegação diária persistente no mobile, oculta em telas a partir de sm. */
export function MobileBottomNavigation() {
  const [location] = useLocation();
  const [isMoreOpen, setIsMoreOpen] = React.useState(false);
  const authCheckQuery = trpc.flightAuth.check.useQuery(undefined, { retry: false });
  const isAuthenticated = authCheckQuery.data?.authenticated === true;
  const isAdmin = authCheckQuery.data?.isAdmin === true;

  return (
    <nav
      aria-label="Navegação principal mobile"
      className="fixed inset-x-3 bottom-3 z-40 grid grid-cols-5 rounded-2xl border border-slate-200/90 bg-white/95 p-1.5 shadow-xl shadow-slate-900/15 backdrop-blur-xl dark:border-slate-700 dark:bg-slate-900/95 sm:hidden"
    >
      {MOBILE_NAVIGATION_ITEMS.map(item => {
        const Icon = icons[item.icon];
        const isActive = item.href === "/" ? location === "/" : location.startsWith(item.href);
        return (
          <Link
            key={item.href}
            href={item.href}
            aria-current={isActive ? "page" : undefined}
            onClick={() => triggerHaptic()}
            className={`flex min-h-12 flex-col items-center justify-center gap-1 rounded-xl text-[10px] font-bold transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 ${
              isActive
                ? "bg-blue-600 text-white shadow-sm"
                : "text-slate-500 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800"
            }`}
          >
            <Icon className="size-4" aria-hidden="true" />
            {item.label}
          </Link>
        );
      })}
      <Sheet open={isMoreOpen} onOpenChange={setIsMoreOpen}>
        <SheetTrigger asChild>
          <button
            type="button"
            aria-label="Mais opções de navegação"
            className="flex min-h-12 flex-col items-center justify-center gap-1 rounded-xl text-[10px] font-bold text-slate-500 transition-colors hover:bg-slate-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 dark:text-slate-300 dark:hover:bg-slate-800"
          >
            <Menu className="size-4" aria-hidden="true" />
            Mais
          </button>
        </SheetTrigger>
        <SheetContent
          side="bottom"
          className="max-h-[min(30rem,calc(100dvh-5rem))] rounded-t-3xl border-slate-200 bg-white px-4 pb-[calc(1rem+env(safe-area-inset-bottom))] pt-2 text-slate-900 dark:border-slate-700 dark:bg-slate-950 dark:text-white"
        >
          <SheetHeader className="px-1 pb-2 pt-3 text-left">
            <SheetTitle>Mais opções</SheetTitle>
            <SheetDescription>
              Acessos e painéis disponíveis para a sua conta.
            </SheetDescription>
          </SheetHeader>
          <div className="grid gap-2 overflow-y-auto px-1 pb-3">
            {authCheckQuery.isLoading ? (
              <p className="rounded-xl bg-slate-100 px-3 py-3 text-sm text-slate-600 dark:bg-slate-900 dark:text-slate-300" role="status">
                Carregando acessos disponíveis...
              </p>
            ) : !isAuthenticated ? (
              <p className="rounded-xl bg-slate-100 px-3 py-3 text-sm text-slate-600 dark:bg-slate-900 dark:text-slate-300">
                Entre para acessar os painéis de avisos e administração.
              </p>
            ) : (
              <>
                <SheetClose asChild>
                  <Link
                    href="/admin/notifications"
                    onClick={() => triggerHaptic()}
                    className="flex min-h-12 items-center gap-3 rounded-xl border border-slate-200 px-3 py-3 text-sm font-semibold transition-colors hover:bg-slate-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 dark:border-slate-700 dark:hover:bg-slate-900"
                  >
                    <Bell className="size-5 text-blue-600 dark:text-blue-300" aria-hidden="true" />
                    Painel de avisos
                  </Link>
                </SheetClose>
                {isAdmin && (
                  <>
                    <SheetClose asChild>
                      <Link
                        href="/admin/telemetria"
                        onClick={() => triggerHaptic()}
                        className="flex min-h-12 items-center gap-3 rounded-xl border border-slate-200 px-3 py-3 text-sm font-semibold transition-colors hover:bg-slate-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 dark:border-slate-700 dark:hover:bg-slate-900"
                      >
                        <MapPinned className="size-5 text-blue-600 dark:text-blue-300" aria-hidden="true" />
                        Locais de Acesso
                      </Link>
                    </SheetClose>
                    <SheetClose asChild>
                      <Link
                        href="/admin/gemini"
                        onClick={() => triggerHaptic()}
                        className="flex min-h-12 items-center gap-3 rounded-xl border border-slate-200 px-3 py-3 text-sm font-semibold transition-colors hover:bg-slate-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 dark:border-slate-700 dark:hover:bg-slate-900"
                      >
                        <Sparkles className="size-5 text-cyan-600 dark:text-cyan-300" aria-hidden="true" />
                        Uso de IA
                      </Link>
                    </SheetClose>
                  </>
                )}
              </>
            )}
          </div>
        </SheetContent>
      </Sheet>
    </nav>
  );
}
