import React from "react";
import { BarChart3, CalendarDays, House, Ticket } from "lucide-react";
import { Link, useLocation } from "wouter";
import { triggerHaptic } from "@/lib/haptics";
import { MOBILE_NAVIGATION_ITEMS } from "@/lib/mobileExperience";

const icons = {
  home: House,
  calendar: CalendarDays,
  ticket: Ticket,
  chart: BarChart3,
} as const;

/** Navegação diária persistente no mobile, oculta em telas a partir de sm. */
export function MobileBottomNavigation() {
  const [location] = useLocation();

  return (
    <nav
      aria-label="Navegação principal mobile"
      className="fixed inset-x-3 bottom-3 z-40 grid grid-cols-4 rounded-2xl border border-slate-200/90 bg-white/95 p-1.5 shadow-xl shadow-slate-900/15 backdrop-blur-xl dark:border-slate-700 dark:bg-slate-900/95 sm:hidden"
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
    </nav>
  );
}
