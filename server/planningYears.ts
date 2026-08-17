import { generatePlanningWeeks } from "../shared/planningWeeks";
import {
  getAllFlightWeeks,
  initFlightWeeks,
  upsertPlanningYear,
} from "./db";

export async function ensurePlanningYearWeeks(year: number) {
  const generatedWeeks = generatePlanningWeeks(year);
  const existingWeeks = await getAllFlightWeeks(year);
  await initFlightWeeks(
    generatedWeeks.map(week => ({
      ...week,
      isDeleted: 0,
      isTicketIssued: 0,
      isSelected: 0,
    })),
    year
  );

  const persistedWeeks = await getAllFlightWeeks(year);
  await upsertPlanningYear({
    year,
    status: "active",
    weekCount: persistedWeeks.length,
  });

  return {
    year,
    created: existingWeeks.length === 0,
    weekCount: persistedWeeks.length,
  };
}
