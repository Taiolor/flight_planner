import "leaflet/dist/leaflet.css";
import { latLngBounds, type LatLngLiteral } from "leaflet";
import React, { useEffect } from "react";
import { CircleMarker, MapContainer, TileLayer, Tooltip, useMap } from "react-leaflet";
import { cn } from "@/lib/utils";

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

/**
 * Mapa interativo sem API key, renderizado com tiles públicos do OpenStreetMap.
 * A atribuição é exibida pelo próprio TileLayer, conforme os requisitos do OSM.
 */
export function OpenStreetMap({ className, initialCenter, initialZoom, points }: OpenStreetMapProps) {
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
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <MapViewport initialCenter={initialCenter} initialZoom={initialZoom} points={points} />
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
      </MapContainer>
    </div>
  );
}
