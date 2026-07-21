const fs = require("fs");

const data = fs.readFileSync("client/src/pages/CalendarView.tsx", "utf8");
const lines = data.split("\n");

const toIsoDateIdx = lines.findIndex(l => l.includes("function toIsoDate"));
let endIso = lines.findIndex((l, i) => i > toIsoDateIdx && l === "}");

const calViewIdx = lines.findIndex(l =>
  l.includes("export default function CalendarView")
);

lines.splice(endIso + 1, calViewIdx - endIso - 1);

lines.splice(endIso + 1, 0, "");
lines.splice(
  endIso + 2,
  0,
  'import { WeekRow, DayMark } from "@/components/flights/types";'
);
lines.splice(
  endIso + 3,
  0,
  'import FlightPopup from "@/components/flights/FlightPopup";'
);

fs.writeFileSync("client/src/pages/CalendarView.tsx", lines.join("\n"));
