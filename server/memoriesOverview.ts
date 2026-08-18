import { getAllFlightWeeks } from "./db";
import { getMemoriesForYear, type MemoryWithMedia } from "./memoriesDb";
import { getFlightDistanceKm, getSaoPauloDate } from "../shared/flightDistance";

export type MemorySegmentStatus = "completed" | "future" | "cancelled";

export type MemorySegment = {
  direction: "ida" | "volta";
  origin: string;
  destination: string;
  flightDatetime: string;
  airline: string | null;
  flightNumber: string | null;
  distanceKm: number | null;
  status: MemorySegmentStatus;
};

export type MemoryTrip = {
  year: number;
  weekNumber: number;
  departureDate: string;
  returnDate: string;
  segments: MemorySegment[];
  totalKm: number;
  completedKm: number;
  futureKm: number;
  memory: MemoryWithMedia | null;
};

export async function getMemoriesOverview(year: number) {
  const [weeks, memories] = await Promise.all([
    getAllFlightWeeks(year),
    getMemoriesForYear(year),
  ]);
  const memoryByWeek = new Map(memories.map(memory => [memory.weekNumber, memory]));
  const today = getSaoPauloDate();

  const trips: MemoryTrip[] = weeks
    .filter(week => Boolean(week.isTicketIssued) && !Boolean(week.isDeleted))
    .map(week => {
      const departureOrigin = week.departureAirport || "GRU";
      const departureDestination = week.returnAirport || "NVT";
      const returnOrigin = week.returnAirport || "NVT";
      const returnDestination = week.departureAirport || "GRU";
      const segments: MemorySegment[] = [];

      const addSegment = (input: Omit<MemorySegment, "distanceKm" | "status"> & { cancelled: boolean }) => {
        const distanceKm = getFlightDistanceKm(input.origin, input.destination);
        const status: MemorySegmentStatus = input.cancelled
          ? "cancelled"
          : input.flightDatetime.slice(0, 10) < today
            ? "completed"
            : "future";
        segments.push({
          direction: input.direction,
          origin: input.origin,
          destination: input.destination,
          flightDatetime: input.flightDatetime,
          airline: input.airline,
          flightNumber: input.flightNumber,
          distanceKm,
          status,
        });
      };

      addSegment({
        direction: "ida",
        origin: departureOrigin,
        destination: departureDestination,
        flightDatetime: week.departureFlightDatetime || week.departureDate,
        airline: week.departureAirline,
        flightNumber: week.departureFlightNumber,
        cancelled: Boolean(week.departureCancelled),
      });

      if (week.ticketType !== "oneway") {
        addSegment({
          direction: "volta",
          origin: returnOrigin,
          destination: returnDestination,
          flightDatetime: week.returnFlightDatetime || week.returnDate,
          airline: week.returnAirline,
          flightNumber: week.returnFlightNumber,
          cancelled: Boolean(week.returnCancelled),
        });
      }

      const completedKm = segments.reduce(
        (sum, segment) =>
          sum + (segment.status === "completed" ? (segment.distanceKm ?? 0) : 0),
        0
      );
      const futureKm = segments.reduce(
        (sum, segment) =>
          sum + (segment.status === "future" ? (segment.distanceKm ?? 0) : 0),
        0
      );

      return {
        year,
        weekNumber: week.weekNumber,
        departureDate: week.departureDate,
        returnDate: week.returnDate,
        segments,
        totalKm: completedKm + futureKm,
        completedKm,
        futureKm,
        memory: memoryByWeek.get(week.weekNumber) ?? null,
      };
    });

  const completedKm = trips.reduce((sum, trip) => sum + trip.completedKm, 0);
  const futureKm = trips.reduce((sum, trip) => sum + trip.futureKm, 0);

  return {
    trips,
    summary: {
      completedKm,
      futureKm,
      totalKm: completedKm + futureKm,
      issuedTrips: trips.length,
    },
  };
}
