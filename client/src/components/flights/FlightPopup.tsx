import React, { useEffect, useRef, useState } from "react";
import {
  Plane,
  X,
  MessageCircle,
  CalendarPlus,
  Download,
  ExternalLink,
  Cloud,
  CloudFog,
  CloudLightning,
  CloudRain,
  CloudSun,
  Snowflake,
  Sun,
  Sunrise,
  Sunset,
  TriangleAlert,
  Wind,
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
import { extractTime, toIsoDate } from "@/lib/utils";
import { getCalendarIssuedLegDates } from "@/lib/calendarIssuedLegDates";
import { AirlineBadge } from "@/components/AirlineBadge";
import { trpc } from "@/lib/trpc";
import {
  readWeatherDetailsVisibility,
  saveWeatherDetailsVisibility,
  type WeatherLeg,
} from "@/lib/weatherDetailsPreference";

export function DestinationWeatherPanel({
  originCode,
  destinationCode,
  destinationDate,
  destinationTime,
  tone,
  detailsVisible,
  onToggleDetails,
  detailsId,
}: {
  originCode: string;
  destinationCode: string;
  destinationDate: string;
  destinationTime: string;
  tone: "blue" | "orange";
  detailsVisible: boolean;
  onToggleDetails: () => void;
  detailsId: string;
}) {
  const weatherQuery = trpc.destinationWeather.forecast.useQuery(
    destinationTime
      ? { airportCode: destinationCode, flightDate: destinationDate, flightTime: destinationTime }
      : { airportCode: destinationCode, flightDate: destinationDate },
    {
      enabled: Boolean(destinationDate),
      staleTime: 60 * 60 * 1000,
      retry: 1,
    }
  );
  const originWeatherQuery = trpc.destinationWeather.forecast.useQuery(
    destinationTime
      ? { airportCode: originCode, flightDate: destinationDate, flightTime: destinationTime }
      : { airportCode: originCode, flightDate: destinationDate },
    {
      enabled: Boolean(destinationDate) && Boolean(originCode) && originCode !== destinationCode,
      staleTime: 60 * 60 * 1000,
      retry: 1,
    }
  );
  const weather = weatherQuery.data;
  const originWeather = originWeatherQuery.data;
  const accentClasses = tone === "blue"
    ? "border-blue-200 bg-blue-100/70 text-blue-900"
    : "border-orange-200 bg-orange-100/70 text-orange-900";
  const WeatherIcon = getWeatherIcon(weather?.available ? weather.weatherCode : undefined);

  const unavailableMessage = !destinationDate
    ? "A data do voo ainda não foi definida."
    : weather?.available === false && weather.reason === "outside_forecast_window"
      ? "A previsão detalhada é liberada até 16 dias antes do voo."
      : weather?.available === false && weather.reason === "unsupported_destination"
        ? "A previsão ainda não está disponível para este aeroporto."
        : "Não foi possível consultar a previsão agora.";

  return (
    <section
      aria-live="polite"
      aria-label={`Previsão no destino ${destinationCode}`}
      data-weather-state={weatherQuery.isLoading ? "loading" : weather?.available ? "available" : "unavailable"}
      className={`col-span-2 rounded-lg border px-2.5 py-2 ${accentClasses}`}
    >
      <div className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wide">
        <WeatherIcon className="size-3.5" aria-hidden="true" />
        <span>Clima no destino</span>
        <button
          type="button"
          onClick={onToggleDetails}
          aria-expanded={detailsVisible}
          aria-controls={detailsId}
          className="ml-auto min-h-7 shrink-0 border border-current px-2 text-[9px] font-semibold normal-case tracking-normal hover:bg-white/45 focus:outline-none focus-visible:ring-2 focus-visible:ring-current"
        >
          {detailsVisible ? "Ocultar detalhes" : "Ver detalhes"}
        </button>
      </div>
      {weatherQuery.isLoading ? (
        <p className="mt-1 text-[11px] text-slate-600" role="status">Carregando previsão…</p>
      ) : weather && weather.available ? (
        <div id={detailsId} className="mt-1 text-[11px] leading-relaxed">
          <p className="font-semibold">{weather.destinationLabel}: {weather.summary}</p>
          {detailsVisible ? <>
            <p className="text-[10px]">{weather.temperatureMinC}–{weather.temperatureMaxC} °C · chuva {weather.precipitationProbability}% · vento {weather.windSpeedKmh} km/h · UV {weather.uvIndexMax}</p>
            {weather.hourlyForecast && (
            <p className="mt-1 font-medium">
              Próximo do voo ({weather.hourlyForecast.time.split("T")[1]}): {weather.hourlyForecast.summary} · {weather.hourlyForecast.temperatureC} °C, sensação {weather.hourlyForecast.apparentTemperatureC} °C · chuva {weather.hourlyForecast.precipitationProbability}% · vento {weather.hourlyForecast.windSpeedKmh} km/h {weather.hourlyForecast.windDirectionLabel} · rajadas {weather.hourlyForecast.windGustsKmh} km/h · visibilidade {weather.hourlyForecast.visibilityKm} km
            </p>
            )}
            {weather.hourlyForecast && originWeather?.available && originWeather.hourlyForecast && (
            <div className="mt-2 border-t border-current/20 pt-1.5 text-[10px] leading-relaxed" aria-label={`Comparação de clima entre ${originWeather.destinationLabel} e ${weather.destinationLabel}`}>
              <p className="font-bold uppercase tracking-wide">Origem × destino no horário do voo</p>
              <p>{originWeather.destinationLabel}: {originWeather.hourlyForecast.temperatureC} °C, sensação {originWeather.hourlyForecast.apparentTemperatureC} °C, visibilidade {originWeather.hourlyForecast.visibilityKm} km → {weather.destinationLabel}: {weather.hourlyForecast.temperatureC} °C, sensação {weather.hourlyForecast.apparentTemperatureC} °C, visibilidade {weather.hourlyForecast.visibilityKm} km</p>
            </div>
            )}
            {(weather.sunriseTime || weather.sunsetTime) && (
            <p className="mt-1 flex flex-wrap gap-x-3 gap-y-1 text-[10px] font-medium">
              {weather.sunriseTime && <span className="inline-flex items-center gap-1"><Sunrise className="size-3" aria-hidden="true" />Nascer do sol {weather.sunriseTime}</span>}
              {weather.sunsetTime && <span className="inline-flex items-center gap-1"><Sunset className="size-3" aria-hidden="true" />Pôr do sol {weather.sunsetTime}</span>}
            </p>
            )}
            {weather.alerts.map(alert => (
            <p key={alert.type} className="mt-1 flex items-start gap-1 text-[10px] font-semibold" role="status">
              {alert.type === "wind" ? <Wind className="mt-0.5 size-3 shrink-0" aria-hidden="true" /> : <TriangleAlert className="mt-0.5 size-3 shrink-0" aria-hidden="true" />}
              <span>{alert.label}</span>
            </p>
            ))}
            {originWeather?.available && originWeather.alerts.filter(alert => alert.type === "visibility").map(alert => (
            <p key={`origin-${alert.type}`} className="mt-1 flex items-start gap-1 text-[10px] font-semibold" role="status">
              <TriangleAlert className="mt-0.5 size-3 shrink-0" aria-hidden="true" />
              <span>Origem {originWeather.destinationLabel}: {alert.label.replace("Atenção: ", "")}</span>
            </p>
            ))}
            <a
            href={weather.sourceUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-1 inline-flex text-[10px] font-semibold underline underline-offset-2 focus:outline-none focus-visible:ring-2 focus-visible:ring-current"
          >
            Previsão para {weather.forecastDate.split("-").reverse().join("/")} · Fonte: {weather.sourceLabel}
            </a>
          </> : <p className="mt-1 text-[10px] font-medium">Detalhes da previsão ocultos.</p>}
        </div>
      ) : (
        <div className="mt-1 text-[11px] leading-relaxed text-slate-700">
          <p>{unavailableMessage}</p>
          {(weatherQuery.isError || weather?.reason === "unavailable") && destinationDate && (
            <button
              type="button"
              onClick={() => void weatherQuery.refetch()}
              className="mt-2 inline-flex min-h-8 items-center border border-current px-2 text-[10px] font-semibold hover:bg-white/45 focus:outline-none focus-visible:ring-2 focus-visible:ring-current"
            >
              Tentar previsão novamente
            </button>
          )}
        </div>
      )}
    </section>
  );
}

function getWeatherIcon(weatherCode?: number) {
  if (weatherCode === 0 || weatherCode === 1) return Sun;
  if (weatherCode === 2 || weatherCode === 3) return Cloud;
  if (weatherCode === 45 || weatherCode === 48) return CloudFog;
  if ([71, 73, 75, 77, 85, 86].includes(weatherCode ?? -1)) return Snowflake;
  if ([95, 96, 99].includes(weatherCode ?? -1)) return CloudLightning;
  if ([51, 53, 55, 56, 57, 61, 63, 65, 66, 67, 80, 81, 82].includes(weatherCode ?? -1)) return CloudRain;
  return CloudSun;
}

export default function FlightPopup({
  mark,
  onClose,
}: {
  mark: DayMark;
  onClose: () => void;
}) {
  const popupRef = useRef<HTMLDivElement>(null);
  const w = mark.week;
  const isOneway = (w.ticketType ?? "roundtrip") === "oneway";
  const hasRescheduledFlight = Boolean(
    w.departureRescheduled || w.returnRescheduled
  );
  const hasCancelledFlight = Boolean(
    w.departureCancelled || w.returnCancelled
  );
  const hasDepartureStatus = Boolean(
    w.departureRescheduled || w.departureCancelled
  );
  const hasReturnStatus = Boolean(
    w.returnRescheduled || w.returnCancelled
  );
  const [weatherDetailsVisibility, setWeatherDetailsVisibility] = useState(() => readWeatherDetailsVisibility());

  useEffect(() => {
    saveWeatherDetailsVisibility(weatherDetailsVisibility);
  }, [weatherDetailsVisibility]);

  const toggleWeatherDetails = (leg: WeatherLeg) => {
    setWeatherDetailsVisibility(current => ({ ...current, [leg]: !current[leg] }));
  };

  const depTime = extractTime(w.departureFlightDatetime);
  const retTime = extractTime(w.returnFlightDatetime);
  const { departureDate: effectiveDepartureDate, returnDate: effectiveReturnDate } =
    getCalendarIssuedLegDates(w);
  const depIsoDate = toIsoDate(effectiveDepartureDate);
  const retIsoDate = effectiveReturnDate ? toIsoDate(effectiveReturnDate) : "";
  const depDisplayDate = depIsoDate
    ? depIsoDate.split("-").reverse().join("/")
    : "—";
  const retDisplayDate = retIsoDate
    ? retIsoDate.split("-").reverse().join("/")
    : "—";

  const depAirlineName =
    airlineNames[(w.departureAirline ?? "").toLowerCase()] ??
    w.departureAirline ??
    "—";
  const retAirlineName =
    airlineNames[(w.returnAirline ?? "").toLowerCase()] ??
    w.returnAirline ??
    "—";

  const depAirport = w.departureAirport || "GRU";
  const retAirport = w.returnAirport || "NVT";

  // Fechar ao clicar fora
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (popupRef.current && !popupRef.current.contains(e.target as Node)) {
        onClose();
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [onClose]);

  // Fechar com Escape
  useEffect(() => {
    function handleKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    document.addEventListener("keydown", handleKey);
    return () => document.removeEventListener("keydown", handleKey);
  }, [onClose]);

  // Montar eventos de calendário
  const depEvent: CalendarEventParams | null = w.departureFlightDatetime
    ? {
        title: `✈️ Voo IDA ${w.departureFlightNumber ?? ""} — ${depAirlineName}`,
        flightDatetime: w.departureFlightDatetime,
        location:
          airportAddresses[depAirport] ??
          airportNames[depAirport] ??
          depAirport,
        description: [
          `Semana ${w.weekNumber}`,
          `Companhia: ${depAirlineName}`,
          w.departureFlightNumber ? `Voo: ${w.departureFlightNumber}` : "",
          w.departureLocator ? `Localizador: ${w.departureLocator}` : "",
          w.departureTerminal ? `Terminal: ${w.departureTerminal}` : "",
          `Rota: ${depAirport} → ${retAirport}`,
        ]
          .filter(Boolean)
          .join("\n"),
      }
    : null;

  const retEvent: CalendarEventParams | null =
    !isOneway && w.returnFlightDatetime
      ? {
          title: `✈️ Voo VOLTA ${w.returnFlightNumber ?? ""} — ${retAirlineName}`,
          flightDatetime: w.returnFlightDatetime,
          location:
            airportAddresses[retAirport] ??
            airportNames[retAirport] ??
            retAirport,
          description: [
            `Semana ${w.weekNumber}`,
            `Companhia: ${retAirlineName}`,
            w.returnFlightNumber ? `Voo: ${w.returnFlightNumber}` : "",
            w.returnLocator ? `Localizador: ${w.returnLocator}` : "",
            w.returnTerminal ? `Terminal: ${w.returnTerminal}` : "",
            `Rota: ${retAirport} → ${depAirport}`,
          ]
            .filter(Boolean)
            .join("\n"),
        }
      : null;

  const allEvents = [depEvent, retEvent].filter(
    Boolean
  ) as CalendarEventParams[];

  // WhatsApp
  const whatsappUrl = buildWhatsAppShareUrl({
    weekLabel: `Semana ${w.weekNumber}`,
    departureDate: depIsoDate,
    departureTime: depTime,
    departureAirport: depAirport,
    departureAirline: w.departureAirline ?? "",
    departureFlightNumber: w.departureFlightNumber ?? "",
    departureLocator: w.departureLocator ?? "",
    returnDate: isOneway ? "" : retIsoDate,
    returnTime: isOneway ? "" : retTime,
    returnAirport: isOneway ? "" : retAirport,
    returnAirline: isOneway ? "" : (w.returnAirline ?? ""),
    returnFlightNumber: isOneway ? "" : (w.returnFlightNumber ?? ""),
    returnLocator: isOneway ? "" : (w.returnLocator ?? ""),
  });

  // Rastreamento
  const depTrackUrl =
    w.departureFlightNumber && depIsoDate
      ? buildFlightTrackUrl(
          w.departureAirline ?? "",
          w.departureFlightNumber,
          depAirport,
          retAirport,
          depIsoDate + "T00:00"
        )
      : null;
  const retTrackUrl =
    !isOneway && w.returnFlightNumber && retIsoDate
      ? buildFlightTrackUrl(
          w.returnAirline ?? "",
          w.returnFlightNumber,
          retAirport,
          depAirport,
          retIsoDate + "T00:00"
        )
      : null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-2 backdrop-blur-sm sm:p-4">
      <div
        ref={popupRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="flight-popup-title"
        className="flex max-h-[calc(100dvh-1rem)] w-full max-w-md flex-col overflow-hidden rounded-2xl bg-white shadow-2xl animate-in fade-in zoom-in-95 duration-150 sm:max-h-[calc(100dvh-2rem)]"
      >
        {/* Cabeçalho */}
        <div className="flex shrink-0 items-center justify-between gap-2 bg-blue-700 px-3 py-2.5 sm:px-4 sm:py-3">
          <div className="flex min-w-0 flex-wrap items-center gap-1.5 sm:gap-2">
            <Plane className="w-4 h-4 text-white" />
            <span id="flight-popup-title" className="text-sm font-bold text-white">
              Semana {w.weekNumber}
            </span>
            {isOneway && (
              <span className="text-[10px] bg-orange-400 text-white px-2 py-0.5 rounded-full font-semibold">
                Somente Ida
              </span>
            )}
            {hasRescheduledFlight && (
              <span className="text-[10px] bg-red-500 text-white px-2 py-0.5 rounded-full font-semibold flex items-center gap-1">
                ⚠️ Remarcado
              </span>
            )}
            {hasCancelledFlight && (
              <span className="text-[10px] bg-slate-700 text-white px-2 py-0.5 rounded-full font-semibold flex items-center gap-1">
                Cancelado
              </span>
            )}
          </div>
          <button
            type="button"
            onClick={onClose}
            autoFocus
            className="grid size-10 shrink-0 place-items-center rounded-md text-white/80 hover:bg-white/15 hover:text-white focus:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-blue-700"
            title="Fechar"
            aria-label="Fechar calendário"
          >
            <X className="size-5" />
          </button>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain p-3 sm:p-4">
          <div className="flex flex-col gap-2.5 sm:gap-3">
          {/* Trecho IDA */}
          <div className="rounded-xl border border-blue-100 bg-blue-50 overflow-hidden">
            <div className="bg-blue-600 px-3 py-1.5 flex items-center gap-1.5">
              <Plane className="w-3 h-3 text-white" />
              <span className="text-[11px] font-bold text-white uppercase tracking-wider">
                Ida
              </span>
              <span className="ml-auto text-[10px] text-blue-200">
                {depAirport} → {retAirport}
              </span>
            </div>
            <div className="px-3 py-2 grid grid-cols-2 gap-x-3 gap-y-1.5 text-xs">
              <div>
                <span className="text-[9px] font-semibold text-blue-400 uppercase tracking-wide block">
                  Data
                </span>
                <span className="text-slate-700 font-medium">
                  {depDisplayDate}
                </span>
              </div>
              <div>
                <span className="text-[9px] font-semibold text-blue-400 uppercase tracking-wide block">
                  Horário
                </span>
                <span className="text-slate-700 font-medium">
                  {depTime || "—"}
                </span>
              </div>
              <div>
                <span className="text-[9px] font-semibold text-blue-400 uppercase tracking-wide block">
                  Companhia
                </span>
                <AirlineBadge airline={w.departureAirline} fallback={depAirlineName} />
              </div>
              <div>
                <span className="text-[9px] font-semibold text-blue-400 uppercase tracking-wide block">
                  Voo
                </span>
                <span className="text-slate-700 font-mono font-medium">
                  {w.departureFlightNumber || "—"}
                </span>
              </div>
              <div>
                <span className="text-[9px] font-semibold text-blue-400 uppercase tracking-wide block">
                  Terminal
                </span>
                <span className="text-slate-700 font-medium">
                  {w.departureTerminal || "—"}
                </span>
              </div>
              {hasDepartureStatus && (
                <div>
                  <span className="text-[9px] font-semibold text-blue-400 uppercase tracking-wide block">
                    Status
                  </span>
                  <span className="text-slate-700 font-medium">
                    {w.departureCancelled ? "Cancelado" : "Remarcado"}
                  </span>
                </div>
              )}
              <DestinationWeatherPanel
                originCode={depAirport}
                destinationCode={retAirport}
                destinationDate={depIsoDate}
                destinationTime={depTime}
                tone="blue"
                detailsVisible={weatherDetailsVisibility.departure}
                onToggleDetails={() => toggleWeatherDetails("departure")}
                detailsId={`weather-details-${w.weekNumber}-departure`}
              />
              {w.departureLocator && (
                <div className="col-span-2">
                  <span className="text-[9px] font-semibold text-blue-400 uppercase tracking-wide block">
                    Localizador
                  </span>
                  <span className="text-slate-700 font-mono font-bold tracking-widest">
                    {w.departureLocator}
                  </span>
                </div>
              )}
              {depTrackUrl && (
                <div className="col-span-2">
                  <a
                    href={depTrackUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-[10px] text-blue-600 hover:underline font-medium"
                  >
                    <ExternalLink className="w-3 h-3" /> Rastrear voo
                  </a>
                </div>
              )}
            </div>
          </div>

          {/* Trecho VOLTA (só se não for somente ida) */}
          {!isOneway && (
            <div className="rounded-xl border border-orange-100 bg-orange-50 overflow-hidden">
              <div className="bg-orange-500 px-3 py-1.5 flex items-center gap-1.5">
                <Plane className="w-3 h-3 text-white rotate-180" />
                <span className="text-[11px] font-bold text-white uppercase tracking-wider">
                  Volta
                </span>
                <span className="ml-auto text-[10px] text-orange-200">
                  {retAirport} → {depAirport}
                </span>
              </div>
              <div className="px-3 py-2 grid grid-cols-2 gap-x-3 gap-y-1.5 text-xs">
                <div>
                  <span className="text-[9px] font-semibold text-orange-400 uppercase tracking-wide block">
                    Data
                  </span>
                  <span className="text-slate-700 font-medium">
                    {retDisplayDate}
                  </span>
                </div>
                <div>
                  <span className="text-[9px] font-semibold text-orange-400 uppercase tracking-wide block">
                    Horário
                  </span>
                  <span className="text-slate-700 font-medium">
                    {retTime || "—"}
                  </span>
                </div>
                <div>
                  <span className="text-[9px] font-semibold text-orange-400 uppercase tracking-wide block">
                    Companhia
                  </span>
                  <AirlineBadge airline={w.returnAirline} fallback={retAirlineName} />
                </div>
              <div>
                <span className="text-[9px] font-semibold text-orange-400 uppercase tracking-wide block">
                  Voo
                  </span>
                  <span className="text-slate-700 font-mono font-medium">
                  {w.returnFlightNumber || "—"}
                </span>
              </div>
              <div>
                <span className="text-[9px] font-semibold text-orange-400 uppercase tracking-wide block">
                  Terminal
                </span>
                <span className="text-slate-700 font-medium">
                  {w.returnTerminal || "—"}
                </span>
              </div>
              {hasReturnStatus && (
                <div>
                  <span className="text-[9px] font-semibold text-orange-400 uppercase tracking-wide block">
                    Status
                  </span>
                  <span className="text-slate-700 font-medium">
                    {w.returnCancelled ? "Cancelado" : "Remarcado"}
                  </span>
                </div>
              )}
                <DestinationWeatherPanel
                  originCode={retAirport}
                  destinationCode={depAirport}
                  destinationDate={retIsoDate}
                  destinationTime={retTime}
                  tone="orange"
                  detailsVisible={weatherDetailsVisibility.return}
                  onToggleDetails={() => toggleWeatherDetails("return")}
                  detailsId={`weather-details-${w.weekNumber}-return`}
                />
                {w.returnLocator && (
                  <div className="col-span-2">
                    <span className="text-[9px] font-semibold text-orange-400 uppercase tracking-wide block">
                      Localizador
                    </span>
                    <span className="text-slate-700 font-mono font-bold tracking-widest">
                      {w.returnLocator}
                    </span>
                  </div>
                )}
                {retTrackUrl && (
                  <div className="col-span-2">
                    <a
                      href={retTrackUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 text-[10px] text-orange-600 hover:underline font-medium"
                    >
                      <ExternalLink className="w-3 h-3" /> Rastrear voo
                    </a>
                  </div>
                )}
              </div>
            </div>
          )}

          {!!mark.additionalFlights?.length && (
            <div className="rounded-xl border border-violet-100 bg-violet-50 overflow-hidden">
              <div className="bg-violet-600 px-3 py-1.5 flex items-center gap-1.5">
                <Plane className="w-3 h-3 text-white" />
                <span className="text-[11px] font-bold text-white uppercase tracking-wider">Trechos adicionais</span>
              </div>
              <div className="divide-y divide-violet-100">
                {mark.additionalFlights.map(flight => (
                  <div key={`${flight.id}-${flight.direction}`} className="px-3 py-2 text-xs text-slate-700">
                    <div className="flex items-center justify-between gap-2">
                      <span className="inline-flex min-w-0 items-center gap-1 font-bold text-violet-800"><span>{flight.direction === "departure" ? "Ida" : "Volta"} ·</span><AirlineBadge airline={flight.airline} fallback="COMPANHIA" className="border-violet-200 bg-white/70 py-0 text-violet-800" /></span>
                      {Boolean(flight.cancelled || flight.rescheduled) && <span className={`rounded-full px-1.5 py-0.5 text-[10px] font-bold ${flight.cancelled ? "bg-rose-100 text-rose-700" : "bg-amber-100 text-amber-700"}`}>{flight.cancelled ? "Cancelado" : "Remarcado"}</span>}
                    </div>
                    <div className="mt-0.5 text-[11px] text-slate-500">{flight.flightDatetime?.replace("T", " ") || "Data a confirmar"} · {flight.airport || "Aeroporto"} · {flight.flightNumber || "Voo a confirmar"}{flight.terminal ? ` · Terminal ${flight.terminal}` : ""}</div>
                    {flight.locator && <div className="mt-0.5 font-mono text-[11px] font-bold tracking-wider text-slate-600">{flight.locator}</div>}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Ações de compartilhamento */}
          <div className="border-t border-slate-100 pt-3 flex flex-col gap-2">
            <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wide">
              Compartilhar & Agenda
            </span>

            {/* WhatsApp */}
            <a
              href={whatsappUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 px-3 py-2 rounded-lg bg-green-500 hover:bg-green-600 transition-colors text-white text-xs font-semibold"
            >
              <MessageCircle className="w-4 h-4" />
              Compartilhar via WhatsApp
            </a>

            {/* Agenda */}
            {allEvents.length > 0 && (
              <div className="grid grid-cols-2 gap-2">
                {/* Google Calendar */}
                {depEvent && (
                  <a
                    href={getGoogleCalendarLink(depEvent)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center justify-center gap-1.5 px-2 py-2 rounded-lg bg-white border border-blue-200 hover:bg-blue-50 transition-colors text-blue-700 text-[11px] font-semibold"
                  >
                    <CalendarPlus className="w-3.5 h-3.5" />
                    Google Ida
                  </a>
                )}
                {retEvent && (
                  <a
                    href={getGoogleCalendarLink(retEvent)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center justify-center gap-1.5 px-2 py-2 rounded-lg bg-white border border-orange-200 hover:bg-orange-50 transition-colors text-orange-700 text-[11px] font-semibold"
                  >
                    <CalendarPlus className="w-3.5 h-3.5" />
                    Google Volta
                  </a>
                )}
                {depEvent && (
                  <a
                    href={getOutlookLink(depEvent)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center justify-center gap-1.5 px-2 py-2 rounded-lg bg-white border border-blue-200 hover:bg-blue-50 transition-colors text-blue-700 text-[11px] font-semibold"
                  >
                    <CalendarPlus className="w-3.5 h-3.5" />
                    Outlook Ida
                  </a>
                )}
                {retEvent && (
                  <a
                    href={getOutlookLink(retEvent)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center justify-center gap-1.5 px-2 py-2 rounded-lg bg-white border border-orange-200 hover:bg-orange-50 transition-colors text-orange-700 text-[11px] font-semibold"
                  >
                    <CalendarPlus className="w-3.5 h-3.5" />
                    Outlook Volta
                  </a>
                )}
                {/* Download ICS */}
                <button
                  onClick={() =>
                    downloadICS(allEvents, `voo-semana-${w.weekNumber}.ics`)
                  }
                  aria-label={`Baixar arquivo ICS da semana ${w.weekNumber}`}
                  className="col-span-2 flex items-center justify-center gap-1.5 px-2 py-2 rounded-lg bg-slate-100 hover:bg-slate-200 transition-colors text-slate-700 text-[11px] font-semibold border border-slate-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                >
                  <Download className="w-3.5 h-3.5" />
                  Baixar .ics (Apple / Outros)
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
      </div>
    </div>
  );
}
