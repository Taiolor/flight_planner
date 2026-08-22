import type { LucideIcon } from "lucide-react";
import React, { type ReactNode } from "react";

export type StatusPillTone = "navy" | "success" | "warning" | "cancelled" | "neutral";

const toneClasses: Record<StatusPillTone, string> = {
  navy: "border-[#315c99] bg-[#071a36] text-white",
  success: "border-emerald-300 bg-emerald-50 text-emerald-800 dark:border-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-200",
  warning: "border-amber-300 bg-amber-50 text-amber-900 dark:border-amber-700 dark:bg-amber-950/40 dark:text-amber-200",
  cancelled: "border-violet-300 bg-[#4B0082] text-white dark:border-violet-500",
  neutral: "border-slate-300 bg-slate-50 text-slate-700 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-200",
};

type StatusPillProps = {
  tone?: StatusPillTone;
  icon?: LucideIcon;
  children: ReactNode;
  className?: string;
};

/** Rótulo semântico reutilizável: a cor é sempre acompanhada de texto e pode receber ícone. */
export function StatusPill({ tone = "navy", icon: Icon, children, className = "" }: StatusPillProps) {
  return (
    <span className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-xs font-semibold ${toneClasses[tone]} ${className}`}>
      {Icon && <Icon className="size-3" aria-hidden="true" />}
      {children}
    </span>
  );
}
