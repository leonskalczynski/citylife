import { MapPin } from "lucide-react";

import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { IncidentMap } from "@/features/incidents/components/IncidentMap";
import type { Incident } from "@/features/incidents/types";

export function IncidentLocationCard({ incident }: { incident: Incident }) {
  const latitude = incident.latitude;
  const longitude = incident.longitude;
  if (latitude == null || longitude == null) {
    if (incident.address || incident.district) return null;
    return (
      <Card>
        <CardContent className="flex items-start gap-3 py-5 text-sm text-[var(--muted)]">
          <MapPin className="mt-0.5 size-4 shrink-0" />
          <p>Esta incidencia no tiene una posición marcada en el mapa.</p>
        </CardContent>
      </Card>
    );
  }

  const locationLabel = [incident.address, incident.district].filter(Boolean).join(" · ") || incident.title;
  return (
    <Card>
      <CardHeader>
        <h2 className="flex items-center gap-2 text-lg font-semibold"><MapPin className="size-5 text-[var(--muted)]" />Ubicación</h2>
        <p className="text-sm text-[var(--muted)]">{locationLabel}</p>
      </CardHeader>
      <CardContent className="space-y-3">
        <IncidentMap
          ariaLabel={`Mapa de ${incident.title}`}
          points={[{ id: incident.id, label: incident.title, latitude, longitude }]}
          className="h-72"
        />
      </CardContent>
    </Card>
  );
}

