import React, { type CSSProperties } from "react";
import { getAirlineLogoAsset } from "@/lib/airlineAssets";
import { formatAirlineDisplayName } from "@/lib/airlinePresentation";

export function AirlineBadge({
  airline,
  fallback = "COMPANHIA A DEFINIR",
  className = "",
  style,
}: {
  airline: string | null | undefined;
  fallback?: string;
  className?: string;
  style?: CSSProperties;
}) {
  const key = airline?.trim().toLowerCase() ?? "";
  const logo = getAirlineLogoAsset(key);

  return (
    <span
      className={`inline-flex max-w-full items-center gap-1.5 rounded-full border border-slate-200 bg-slate-50 px-2 py-0.5 text-xs font-semibold text-slate-700 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100 ${className}`}
      style={style}
      data-airline-badge
    >
      {logo ? (
        <span className="grid size-4 shrink-0 place-items-center rounded-full bg-white/90 p-0.5">
          <img src={logo} alt="" aria-hidden="true" className="h-full w-full object-contain" />
        </span>
      ) : null}
      <span className="truncate">{formatAirlineDisplayName(airline, fallback)}</span>
    </span>
  );
}
