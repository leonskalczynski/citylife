import { ArrowUpRight } from "lucide-react";
import { Link } from "react-router";

import { IncidentMap, type MapPoint } from "@/features/incidents/components/IncidentMap";
import type { DashboardDistrict, DashboardMapPoint } from "@/features/dashboard/types";

const statusLabels: Record<string, string> = {
  REPORTED: "Reportada",
  VALIDATED: "Validada",
  REJECTED: "Rechazada",
  ASSIGNED: "Asignada",
  IN_PROGRESS: "En curso",
  RESOLVED: "Resuelta",
  REOPENED: "Reabierta",
  CLOSED: "Cerrada",
};

export function TerritoryPanel({ points, districts, incidentHref, districtHref }: { points: DashboardMapPoint[]; districts: DashboardDistrict[]; incidentHref: (id: string) => string; districtHref?: (district: string) => string }) {
  const mapPoints: MapPoint[] = points.map((point) => ({
    id: point.id,
    latitude: point.latitude,
    longitude: point.longitude,
    label: point.title,
    popup: (
      <div className="min-w-48">
        <p className="font-semibold text-[var(--ink)]">{point.title}</p>
        <p className="mt-1 text-xs text-[var(--muted)]">{point.categoryName} · {statusLabels[point.status]}</p>
        <Link className="mt-3 inline-flex items-center gap-1 text-sm font-semibold text-[var(--accent-ink)]" to={incidentHref(point.id)}>
          Abrir incidencia <ArrowUpRight className="size-3.5" />
        </Link>
      </div>
    ),
  }));
  const maxDistrict = Math.max(1, ...districts.map((item) => item.count));

  return (
    <div className="overflow-hidden rounded-[14px] border border-[var(--line)] bg-[var(--surface)]">
      <div className="grid gap-5 p-5 lg:grid-cols-[1.5fr_0.8fr]">
        {mapPoints.length > 0 ? (
          <IncidentMap ariaLabel="Mapa de incidencias del panel" points={mapPoints} fitAll className="h-80" />
        ) : (
          <div className="city-grid grid h-80 place-items-center rounded-2xl bg-[var(--surface-soft)]">
            <p className="rounded-full bg-[var(--surface)] px-4 py-2 text-xs font-medium text-[var(--muted)]">Aún no hay incidencias geolocalizadas</p>
          </div>
        )}
        <div>
          <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-[var(--muted)]">Distritos</p>
          <ul className="mt-4 space-y-4">
            {districts.slice(0, 6).map((district) => {
              const content = (
                <>
                  <div className="flex items-baseline justify-between gap-3 text-sm">
                    <span className="truncate font-medium">{district.district}</span>
                    <span className="tabular-nums text-[var(--muted)]">{district.count}</span>
                  </div>
                  <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-[var(--surface-soft)]" aria-hidden="true">
                    <span className="block h-full rounded-full bg-[var(--accent)]" style={{ width: `${Math.max((district.count / maxDistrict) * 100, 3)}%` }} />
                  </div>
                </>
              );
              return (
                <li key={district.district}>
                  {districtHref ? (
                    <Link className="block rounded-lg transition-opacity hover:opacity-70" to={districtHref(district.district)}>{content}</Link>
                  ) : content}
                </li>
              );
            })}
            {districts.length === 0 && <li className="text-sm text-[var(--muted)]">Sin datos de distrito.</li>}
          </ul>
        </div>
      </div>
    </div>
  );
}
