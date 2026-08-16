import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/** Converte DD/MM/YYYY para YYYY-MM-DD sem alterar datas já normalizadas. */
export function toIsoDate(dateStr: string | null | undefined): string {
  if (!dateStr) return "";
  if (dateStr.includes("/")) {
    const [d, m, y] = dateStr.split("/");
    return `${y}-${m.padStart(2, "0")}-${d.padStart(2, "0")}`;
  }
  return dateStr;
}

/** Extrai HH:mm de datetimes ISO ou valores separados por espaço. */
export function extractTime(dt: string | null | undefined): string {
  if (!dt) return "";
  const timePart = dt.includes("T") ? dt.split("T")[1] : dt.split(" ")[1];
  return timePart ? timePart.slice(0, 5) : "";
}
