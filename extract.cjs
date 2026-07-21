const fs = require("fs");

const data = fs.readFileSync("client/src/pages/CalendarView.tsx", "utf8");
const lines = data.split("\n");

const start = lines.findIndex(l => l.includes("function FlightPopup({"));
const end = lines.findIndex((l, i) => i > start && l === "}");

const func = lines.slice(start, end + 1).join("\n");

const newComponent =
  `import { useEffect, useRef } from "react";
import {
  Plane,
  X,
  MessageCircle,
  CalendarPlus,
  Download,
  ExternalLink,
} from "lucide-react";
import {
  getGoogleCalendarLink,
  getOutlookLink,
  downloadICS,
  airportNames,
  airportAddresses,
  airlineNames,
  buildFlightTrackUrl,
  buildWhatsAppShareUrl,
  CalendarEventParams,
} from "@/lib/calendarHelper";
import { WeekRow, DayMark } from "./types";

// Utils
function extractTime(dt: string | null | undefined): string {
  if (!dt) return "";
  const t = dt.includes("T") ? dt.split("T")[1] : dt.split(" ")[1];
  return t ? t.slice(0, 5) : "";
}

function toIsoDate(dateStr: string): string {
  if (!dateStr) return "";
  if (dateStr.includes("/")) {
    const [d, m, y] = dateStr.split("/");
    return \`\${y}-\${m.padStart(2, "0")}-\${d.padStart(2, "0")}\`;
  }
  return dateStr;
}

export default ` +
  func +
  `\n`;

const types = `export type WeekRow = {
  weekNumber: number;
  departureDate: string;
  returnDate: string;
  isTicketIssued: number | boolean;
  departureAirline?: string | null;
  returnAirline?: string | null;
  departureFlightDatetime?: string | null;
  returnFlightDatetime?: string | null;
  departureAirport?: string | null;
  returnAirport?: string | null;
  departureLocator?: string | null;
  returnLocator?: string | null;
  departureFlightNumber?: string | null;
  returnFlightNumber?: string | null;
  ticketType?: string | null;
  isDeleted?: number | boolean;
};

export type DayMark = {
  departure: boolean;
  return: boolean;
  isPast: boolean;
  week: WeekRow;
};
`;

fs.writeFileSync("client/src/components/flights/types.ts", types);
fs.writeFileSync("client/src/components/flights/FlightPopup.tsx", newComponent);

// Remove the function and types from CalendarView.tsx
lines.splice(start, end - start + 1);

const exportIdx = lines.findIndex(l =>
  l.includes("export default function CalendarView")
);
lines.splice(
  exportIdx,
  0,
  'import FlightPopup from "@/components/flights/FlightPopup";'
);
lines.splice(
  exportIdx,
  0,
  'import { WeekRow, DayMark } from "@/components/flights/types";'
);

const wrStart = lines.findIndex(l => l.includes("type WeekRow = {"));
const wrEnd = lines.findIndex((l, i) => i > wrStart && l === "};");
if (wrStart !== -1) {
  lines.splice(wrStart, wrEnd - wrStart + 1);
}
const dmStart = lines.findIndex(l => l.includes("type DayMark = {"));
const dmEnd = lines.findIndex((l, i) => i > dmStart && l === "};");
if (dmStart !== -1) {
  lines.splice(dmStart, dmEnd - dmStart + 1);
}

fs.writeFileSync("client/src/pages/CalendarView.tsx", lines.join("\n"));
