import { History } from "lucide-react";

import { Card, CardContent, CardHeader } from "@/components/ui/card";
import type { IncidentStatus, IncidentStatusChange } from "@/features/incidents/types";

const statusLabels: Record<IncidentStatus, string> = {
  REPORTED: "Incidencia reportada",
  VALIDATED: "Incidencia validada",
  REJECTED: "Incidencia rechazada",
  ASSIGNED: "Incidencia asignada",
  IN_PROGRESS: "Intervención iniciada",
  RESOLVED: "Incidencia resuelta",
  REOPENED: "Incidencia reabierta",
  CLOSED: "Incidencia cerrada",
};

const roleLabels: Record<string, string> = {
  CITIZEN: "Ciudadanía",
  OPERATOR: "Operación",
  TECHNICIAN: "Equipo técnico",
  ADMIN: "Administración",
  ANALYST: "Análisis",
};

export function IncidentTimeline({ changes, isLoading, isError }: { changes?: IncidentStatusChange[]; isLoading: boolean; isError: boolean }) {
  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-2"><History className="size-5 text-slate-500" /><h2 className="text-lg font-semibold">Historial</h2></div>
        <p className="text-sm text-slate-600">Cambios de estado registrados por Citylife.</p>
      </CardHeader>
      <CardContent>
        {isLoading && <div className="space-y-4" aria-label="Cargando historial"><div className="h-14 animate-pulse rounded-md bg-slate-100" /><div className="h-14 animate-pulse rounded-md bg-slate-100" /></div>}
        {isError && <p className="text-sm text-red-700">No se ha podido cargar el historial.</p>}
        {changes?.length === 0 && <p className="text-sm text-slate-600">Todavía no hay cambios registrados.</p>}
        {changes && changes.length > 0 && (
          <ol className="space-y-0">
            {changes.map((change, index) => {
              const isLatest = index === changes.length - 1;
              return (
                <li key={change.id} className="relative grid grid-cols-[1.25rem_1fr] gap-3 pb-6 last:pb-0">
                  {index < changes.length - 1 && <span className="absolute left-[0.34rem] top-3 h-full w-px bg-slate-200" aria-hidden="true" />}
                  <span className={`relative z-10 mt-1 size-3 rounded-full border-2 ${isLatest ? "border-[var(--accent-ink)] bg-[var(--accent)]" : "border-slate-400 bg-white"}`} aria-hidden="true" />
                  <div>
                    <div className="flex flex-col justify-between gap-1 sm:flex-row sm:items-baseline"><p className="font-semibold text-slate-950">{statusLabels[change.newStatus]}</p><time className="text-xs text-slate-500" dateTime={change.changedAt}>{formatDate(change.changedAt)}</time></div>
                    <p className="mt-1 text-sm text-slate-600">{change.changedBy.displayName} · {roleLabels[change.changedBy.role] ?? change.changedBy.role}</p>
                    {change.reason && <p className="mt-2 rounded-md bg-slate-50 px-3 py-2 text-sm leading-6 text-slate-700">{change.reason}</p>}
                  </div>
                </li>
              );
            })}
          </ol>
        )}
      </CardContent>
    </Card>
  );
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat("es-ES", { dateStyle: "medium", timeStyle: "short" }).format(new Date(value));
}
