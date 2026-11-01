import L, { type LatLngBoundsExpression, type LeafletEvent } from "leaflet";
import { useEffect, type ReactNode } from "react";
import { MapContainer, Marker, Popup, TileLayer, useMap, useMapEvents } from "react-leaflet";

import "leaflet/dist/leaflet.css";

export type MapPosition = { latitude: number; longitude: number };

export type MapPoint = MapPosition & {
  id: string;
  label: string;
  popup?: ReactNode;
};

type IncidentMapProps = {
  points?: MapPoint[];
  selected?: MapPosition;
  onSelect?: (position: MapPosition) => void;
  ariaLabel: string;
  className?: string;
  fitAll?: boolean;
};

const MADRID: [number, number] = [40.4168, -3.7038];
const incidentIcon = L.divIcon({
  className: "citylife-map-marker",
  html: '<span aria-hidden="true"></span>',
  iconAnchor: [14, 28],
  popupAnchor: [0, -30],
});

export function IncidentMap({ points = [], selected, onSelect, ariaLabel, className = "h-80", fitAll = false }: IncidentMapProps) {
  const initialCenter: [number, number] = selected
    ? [selected.latitude, selected.longitude]
    : points[0]
      ? [points[0].latitude, points[0].longitude]
      : MADRID;

  return (
    <div className={`overflow-hidden rounded-2xl border-2 border-[var(--line)] bg-[var(--surface-soft)] ${className}`} role="region" aria-label={ariaLabel}>
      <MapContainer center={initialCenter} zoom={selected || points.length === 1 ? 16 : 12} scrollWheelZoom className="h-full w-full" attributionControl>
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <MapViewport points={points} selected={selected} fitAll={fitAll} />
        {onSelect && <MapSelection onSelect={onSelect} />}
        {points.map((point) => (
          <Marker key={point.id} position={[point.latitude, point.longitude]} icon={incidentIcon} title={point.label} alt={point.label}>
            {point.popup && <Popup>{point.popup}</Popup>}
          </Marker>
        ))}
        {selected && (
          <Marker
            position={[selected.latitude, selected.longitude]}
            icon={incidentIcon}
            draggable={Boolean(onSelect)}
            title="Ubicación seleccionada"
            alt="Ubicación seleccionada"
            eventHandlers={onSelect ? { dragend: (event: LeafletEvent) => {
              const position = event.target.getLatLng();
              onSelect({ latitude: position.lat, longitude: position.lng });
            } } : undefined}
          />
        )}
      </MapContainer>
    </div>
  );
}

function MapSelection({ onSelect }: { onSelect: (position: MapPosition) => void }) {
  useMapEvents({ click: ({ latlng }) => onSelect({ latitude: latlng.lat, longitude: latlng.lng }) });
  return null;
}

function MapViewport({ points, selected, fitAll }: { points: MapPoint[]; selected?: MapPosition; fitAll: boolean }) {
  const map = useMap();
  const pointsKey = points.map((point) => `${point.latitude},${point.longitude}`).join("|");

  useEffect(() => {
    if (selected) {
      map.setView([selected.latitude, selected.longitude], Math.max(map.getZoom(), 16));
      return;
    }
    if (fitAll && points.length > 1) {
      const bounds = points.map((point) => [point.latitude, point.longitude]) as LatLngBoundsExpression;
      map.fitBounds(bounds, { padding: [32, 32], maxZoom: 15 });
      return;
    }
    if (points.length === 1) map.setView([points[0].latitude, points[0].longitude], 16);
  }, [fitAll, map, pointsKey, selected?.latitude, selected?.longitude]);

  return null;
}
