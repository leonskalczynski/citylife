import { Crosshair, MapPinOff } from "lucide-react";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import { IncidentMap, type MapPosition } from "@/features/incidents/components/IncidentMap";

type IncidentLocationPickerProps = {
  value?: MapPosition;
  onChange: (position?: MapPosition) => void;
};

export function IncidentLocationPicker({ value, onChange }: IncidentLocationPickerProps) {
  const [isLocating, setIsLocating] = useState(false);
  const [error, setError] = useState<string>();

  const locate = () => {
    setError(undefined);
    if (!navigator.geolocation) {
      setError("Este navegador no ofrece geolocalización.");
      return;
    }
    setIsLocating(true);
    navigator.geolocation.getCurrentPosition(
      ({ coords }) => {
        onChange({ latitude: roundCoordinate(coords.latitude), longitude: roundCoordinate(coords.longitude) });
        setIsLocating(false);
      },
      (geolocationError) => {
        setError(geolocationMessage(geolocationError.code));
        setIsLocating(false);
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 60000 },
    );
  };

  return (
    <div className="space-y-3">
      <IncidentMap ariaLabel="Selector de ubicación de la incidencia" selected={value} onSelect={(position) => { setError(undefined); onChange(roundPosition(position)); }} />
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-xs leading-5 text-slate-500">Haz clic en el mapa o arrastra el marcador para ajustar la posición.</p>
        <div className="flex flex-wrap gap-2">
          {value && <Button type="button" variant="outline" className="h-9 px-3" onClick={() => onChange(undefined)}><MapPinOff className="mr-2 size-4" />Quitar ubicación</Button>}
          <Button type="button" variant="outline" className="h-9 px-3" onClick={locate} disabled={isLocating}><Crosshair className="mr-2 size-4" />{isLocating ? "Localizando…" : "Usar mi ubicación"}</Button>
        </div>
      </div>
      {value && <p className="text-xs font-medium text-slate-700">Coordenadas: {value.latitude.toFixed(5)}, {value.longitude.toFixed(5)}</p>}
      {error && <p role="alert" className="text-sm text-red-700">{error}</p>}
    </div>
  );
}

function roundPosition(position: MapPosition): MapPosition {
  return { latitude: roundCoordinate(position.latitude), longitude: roundCoordinate(position.longitude) };
}

function roundCoordinate(value: number) { return Math.round(value * 1_000_000) / 1_000_000; }

function geolocationMessage(code: number) {
  if (code === 1) return "No se ha concedido permiso para acceder a tu ubicación.";
  if (code === 2) return "No se ha podido determinar tu ubicación actual.";
  return "La ubicación está tardando demasiado. Puedes marcarla manualmente en el mapa.";
}
