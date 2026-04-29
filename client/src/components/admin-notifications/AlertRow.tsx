import { Plane, ChevronRight } from "lucide-react";
import { formatAirline, formatDatetimeBRT, formatRelativeTime } from "./utils";
import { StatusBadge, AlertStatus } from "./StatusBadge";

export type AlertType = {
  weekNumber: number;
  direction: "ida" | "volta";
  avisoLabel: string;
  avisoMinutes: number;
  flightDatetime: string;
  alertDatetime: string;
  airline: string;
  flightNumber: string;
  status: "pending" | "sent" | "past";
  minutesUntilAlert: number;
};

export function AlertRow({ alert }: { alert: AlertType }) {
  return (
    <div
      className={`px-4 py-3 flex items-center gap-3 ${alert.status === "past" ? "opacity-50" : ""}`}
    >
      <div
        className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
          alert.direction === "ida" ? "bg-blue-100" : "bg-orange-100"
        }`}
      >
        <Plane
          className={`w-4 h-4 ${alert.direction === "ida" ? "text-blue-600" : "text-orange-500 rotate-180"}`}
        />
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="font-medium text-gray-800 text-sm">
            Semana {alert.weekNumber}
          </span>
          <span className="text-gray-400 text-xs">·</span>
          <span className="text-gray-600 text-sm">
            {alert.direction === "ida" ? "Ida" : "Volta"}
          </span>
          {alert.airline && (
            <>
              <span className="text-gray-400 text-xs">·</span>
              <span className="text-gray-600 text-sm">
                {formatAirline(alert.airline)} {alert.flightNumber}
              </span>
            </>
          )}
          <span className="text-gray-400 text-xs">·</span>
          <span className="text-xs text-indigo-600 font-medium">
            {alert.avisoLabel}
          </span>
        </div>
        <div className="flex items-center gap-3 mt-0.5">
          <span className="text-xs text-gray-400">
            Alerta: {formatDatetimeBRT(alert.alertDatetime)}
          </span>
          <ChevronRight className="w-3 h-3 text-gray-300" />
          <span className="text-xs text-gray-400">
            Voo:{" "}
            {formatDatetimeBRT(
              alert.flightDatetime +
                (alert.flightDatetime.includes("T") &&
                !alert.flightDatetime.includes("+")
                  ? "-03:00"
                  : "")
            )}
          </span>
        </div>
      </div>
      <div className="flex flex-col items-end gap-1 flex-shrink-0">
        <StatusBadge status={alert.status as AlertStatus} />
        {alert.status === "pending" && (
          <span className="text-xs text-gray-500">
            {formatRelativeTime(alert.alertDatetime)}
          </span>
        )}
      </div>
    </div>
  );
}
