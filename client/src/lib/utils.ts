import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/** Extrai HH:mm de um datetime "YYYY-MM-DDTHH:mm" ou "DD/MM/YYYY HH:mm" */
export function extractTime(dt: string | null | undefined): string {
  if (!dt) return "";
  const t = dt.includes("T") ? dt.split("T")[1] : dt.split(" ")[1];
  return t ? t.slice(0, 5) : "";
}

/** Converte "DD/MM/YYYY" para "YYYY-MM-DD" */
export function toIsoDate(dateStr: string | null | undefined): string {
  if (!dateStr) return "";
  if (dateStr.includes("/")) {
    const [d, m, y] = dateStr.split("/");
    return `${y}-${m.padStart(2, "0")}-${d.padStart(2, "0")}`;
  }
  return dateStr;
}
