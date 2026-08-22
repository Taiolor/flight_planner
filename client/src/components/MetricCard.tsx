import type { LucideIcon } from "lucide-react";
import React from "react";

export type MetricCardAccent = "navy" | "green" | "amber" | "violet" | "rose";
export type MetricCardVariant = "surface" | "transparent";

const accentClasses: Record<MetricCardAccent, string> = {
  navy: "bg-sky-300/15 text-sky-100 ring-sky-200/30",
  green: "bg-emerald-300/15 text-emerald-100 ring-emerald-200/30",
  amber: "bg-amber-300/15 text-amber-100 ring-amber-200/30",
  violet: "bg-violet-300/15 text-violet-100 ring-violet-200/30",
  rose: "bg-rose-300/15 text-rose-100 ring-rose-200/30",
};

type MetricCardProps = {
  title: string;
  value: string;
  subtitle?: string;
  icon?: LucideIcon;
  trend?: { value: number; label: string };
  accent?: MetricCardAccent;
  variant?: MetricCardVariant;
  valueClassName?: string;
  className?: string;
};

/** Métrica reutilizável para dashboards: superfície navy e diferenciação semântica somente nos acentos. */
export function MetricCard({
  title,
  value,
  subtitle,
  icon: Icon,
  trend,
  accent = "navy",
  variant = "surface",
  valueClassName,
  className = "",
}: MetricCardProps) {
  const isSurface = variant === "surface";
  const trendTone = trend && trend.value < 0 ? "text-rose-200" : "text-emerald-200";

  return (
    <article
      className={`${isSurface ? "overflow-hidden rounded-2xl border border-[#315c99] bg-[#071a36] p-3 text-white shadow-lg sm:p-5" : "min-w-0 text-center text-white"} ${className}`}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1 overflow-hidden">
          <p className="mb-1 text-xs font-semibold uppercase tracking-wider text-white/80">{title}</p>
          <p className={`break-all text-sm font-bold leading-tight sm:text-2xl ${valueClassName ?? "text-white"}`}>{value}</p>
          {subtitle && <p className="mt-1 line-clamp-2 text-xs text-white/75">{subtitle}</p>}
        </div>
        {Icon && (
          <div className={`shrink-0 rounded-xl p-2 ring-1 ${accentClasses[accent]}`}>
            <Icon className="size-5" aria-hidden="true" />
          </div>
        )}
      </div>
      {trend && (
        <p className={`mt-3 text-xs font-semibold ${trendTone}`}>
          {trend.value >= 0 ? "+" : ""}{trend.value.toFixed(1)}% <span className="font-normal text-white/70">{trend.label}</span>
        </p>
      )}
    </article>
  );
}
