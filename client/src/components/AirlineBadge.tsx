import React, { type CSSProperties } from "react";
import { formatAirlineDisplayName } from "@/lib/airlinePresentation";

const AIRLINE_LOGOS: Record<string, string> = {
  latam: "https://d2xsxph8kpxj0f.cloudfront.net/310419663028456038/HQ655wm9a6bck22hJAwYRc/logo-latam_a13bb510.png",
  gol: "https://d2xsxph8kpxj0f.cloudfront.net/310419663028456038/HQ655wm9a6bck22hJAwYRc/logo-gol_c86ba55a.png",
  azul: "https://d2xsxph8kpxj0f.cloudfront.net/310419663028456038/HQ655wm9a6bck22hJAwYRc/logo-azul_e89c8b63.png",
};

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
  const logo = AIRLINE_LOGOS[key];

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
