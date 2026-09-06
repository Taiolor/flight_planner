import "leaflet/dist/leaflet.css";
import { latLngBounds, type LatLngLiteral } from "leaflet";
import React, { useEffect, useId, useState } from "react";
import { CircleMarker, MapContainer, TileLayer, Tooltip, useMap } from "react-leaflet";
import { LocateFixed, LoaderCircle } from "lucide-react";
import { cn } from "@/lib/utils";

export const OPENSTREETMAP_TILE_URL = "/map-tiles/{z}/{x}/{y}.png";
export const OPENSTREETMAP_ATTRIBUTION =
  '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors';

export type OpenStreetMapPoint = {
  id: string | number;
  position: LatLngLiteral;
  color?: string;
  label: string;
};

type OpenStreetMapProps = {
  className?: string;
  initialCenter: LatLngLiteral;
  initialZoom: number;
  points: OpenStreetMapPoint[];
};

type GeolocationStatus = "idle" | "locating" | "located" | "error";

type UserLocation = LatLngLiteral;

function MapViewport({
  initialCenter,
  initialZoom,
  points,
}: Omit<OpenStreetMapProps, "className">) {
  const map = useMap();

  useEffect(() => {
    if (points.length === 0) {
      map.setView(initialCenter, initialZoom);
      return;
    }

    if (points.length === 1) {
      map.setView(points[0].position, Math.max(initialZoom, 7));
      return;
    }

    const bounds = latLngBounds(points.map(point => [point.position.lat, point.position.lng]));
    if (bounds.isValid()) {
      map.fitBounds(bounds, { padding: [48, 48], maxZoom: 7 });
    }
  }, [initialCenter.lat, initialCenter.lng, initialZoom, map, points]);

  return null;
}

function MapLocationButton({ onLocationChange }: { onLocationChange: (location: UserLocation) => void }) {
  const map = useMap();
  const statusId = useId();
  const [status, setStatus] = useState<GeolocationStatus>("idle");

  const handleLocate = () => {
    if (!navigator.geolocation) {
      setStatus("error");
      return;
    }

    setStatus("locating");
    navigator.geolocation.getCurrentPosition(
      ({ coords }) => {
        const location = { lat: coords.latitude, lng: coords.longitude };
        const reducedMotion = window.matchMedia?.("(prefers-reduced-motion: reduce)").matches ?? false;
        map.flyTo([location.lat, location.lng], Math.max(map.getZoom(), 13), {
          animate: !reducedMotion,
          duration: reducedMotion ? 0 : 0.6,
        });
        onLocationChange(location);
        setStatus("located");
      },
      () => setStatus("error"),
      { enableHighAccuracy: false, maximumAge: 15 * 60 * 1000, timeout: 10_000 }
    );
  };

  const statusMessage =
    status === "locating"
      ? "Obtendo sua localização…"
      : status === "located"
        ? "Mapa centralizado na sua localização"
        : status === "error"
          ? "Não foi possível acessar sua localização"
          : null;

  return (
    <div className="pointer-events-none absolute right-3 top-3 z-[1000] flex flex-col items-end gap-2">
      <button
        type="button"
        onClick={handleLocate}
        disabled={status === "locating"}
        aria-label={status === "locating" ? "Obtendo sua localização atual" : "Centralizar na minha localização atual"}
        aria-busy={status === "locating"}
        aria-describedby={statusMessage ? statusId : undefined}
        title={status === "locating" ? "Obtendo sua localização atual" : "Centralizar na minha localização atual"}
        className={cn(
          "pointer-events-auto inline-flex min-h-11 min-w-11 items-center justify-center rounded-xl border border-slate-200/80 bg-white/95 text-slate-700 shadow-lg backdrop-blur transition-colors duration-200 hover:bg-blue-50 hover:text-blue-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 disabled:cursor-wait disabled:opacity-70",
          status === "locating" && "border-blue-300 bg-blue-50 text-blue-700",
          status === "located" && "bg-blue-50 text-blue-700"
        )}
      >
        {status === "locating" ? (
          <LoaderCircle className="h-5 w-5 animate-spin" aria-hidden="true" />
        ) : (
          <LocateFixed className="h-5 w-5" aria-hidden="true" />
        )}
      </button>
      {statusMessage ? (
        <span
          id={statusId}
          role="status"
          aria-live="polite"
          className={cn(
            "max-w-56 rounded-lg border px-2.5 py-1.5 text-right text-xs font-medium shadow-md backdrop-blur",
            status === "error"
              ? "border-rose-200 bg-rose-50/95 text-rose-800"
              : "border-blue-200 bg-blue-50/95 text-blue-800"
          )}
        >
          {statusMessage}
        </span>
      ) : null}
    </div>
  );
}

/**
 * Mapa interativo sem API key, renderizado com tiles públicos do OpenStreetMap.
 * A atribuição é exibida pelo próprio TileLayer, conforme os requisitos do OSM.
 */
export function OpenStreetMap({ className, initialCenter, initialZoom, points }: OpenStreetMapProps) {
  const [tileLoaded, setTileLoaded] = useState(false);
  const [tileLoadFailed, setTileLoadFailed] = useState(false);
  const [userLocation, setUserLocation] = useState<UserLocation | null>(null);

  return (
    <div className={cn("relative h-[500px] w-full overflow-hidden", className)}>
      <MapContainer
        center={initialCenter}
        zoom={initialZoom}
        className="h-full w-full"
        scrollWheelZoom={false}
        aria-label="Mapa de localização dos eventos"
      >
        <TileLayer
          attribution={OPENSTREETMAP_ATTRIBUTION}
          url={OPENSTREETMAP_TILE_URL}
          eventHandlers={{
            load: () => setTileLoaded(true),
            tileerror: () => setTileLoadFailed(true),
          }}
        />
        <MapViewport initialCenter={initialCenter} initialZoom={initialZoom} points={points} />
        <MapLocationButton onLocationChange={setUserLocation} />
        {points.map(point => (
          <CircleMarker
            key={point.id}
            center={point.position}
            pathOptions={{ color: point.color ?? "#2563eb", fillColor: point.color ?? "#2563eb", fillOpacity: 0.8 }}
            radius={8}
          >
            <Tooltip direction="top" offset={[0, -8]} opacity={1}>
              {point.label}
            </Tooltip>
          </CircleMarker>
        ))}
        {userLocation ? (
          <CircleMarker
            center={userLocation}
            pathOptions={{ color: "#1d4ed8", fillColor: "#60a5fa", fillOpacity: 0.9, weight: 3 }}
            radius={7}
          >
            <Tooltip direction="top" offset={[0, -8]} opacity={1}>
              Sua localização atual
            </Tooltip>
          </CircleMarker>
        ) : null}
      </MapContainer>
      {tileLoadFailed && !tileLoaded ? (
        <div className="pointer-events-none absolute inset-x-4 bottom-4 rounded-lg border border-amber-300/70 bg-slate-950/90 px-3 py-2 text-center text-xs text-amber-100" role="status">
          A base cartográfica está indisponível no momento. Os pontos aproximados continuam disponíveis.
        </div>
      ) : null}
    </div>
  );
}
