import { Link } from "react-router";

import type { DashboardEvent } from "@/features/dashboard/types";

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

export function OperationalPulse({ events, incidentHref }: { events: DashboardEvent[]; incidentHref: (id: string) => string }) {
  const ordered = [...events].sort((a, b) => +new Date(b.changedAt) - +new Date(a.changedAt)).slice(0, 4);

  return (
    <div className="mt-8">
      <div className="flex items-center justify-between gap-4">
        <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-[var(--muted)]">Pulso operativo</p>
        <p className="text-xs text-[var(--muted)]">{ordered.length > 0 ? "Últimos movimientos" : "Sin actividad reciente"}</p>
      </div>

      {ordered.length === 0 ? <p className="mt-4 rounded-[7px] bg-[var(--surface-soft)] px-4 py-3 text-sm text-[var(--muted)]">No hay movimientos recientes.</p> : <ul className="mt-4 grid gap-2 md:grid-cols-2">{ordered.map((event) => <li key={`${event.incidentId}-${event.changedAt}`}><Link to={incidentHref(event.incidentId)} className="flex items-center justify-between gap-4 rounded-[7px] border border-[var(--line)] px-4 py-3 transition-colors hover:bg-[var(--surface-soft)] focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-[color-mix(in_srgb,var(--accent)_50%,transparent)]"><span className="min-w-0"><span className="block truncate text-sm font-semibold">{event.title}</span><span className="mt-1 block text-xs text-[var(--muted)]">{statusLabels[event.status]} · {event.categoryName}</span></span><time className="shrink-0 text-xs text-[var(--muted)]" dateTime={event.changedAt}>{formatAxis(event.changedAt)}</time></Link></li>)}</ul>}
    </div>
  );
}

function formatAxis(value: string) {
  const date = new Date(value);
  const now = new Date();
  const sameDay = date.toDateString() === now.toDateString();
  return new Intl.DateTimeFormat("es-ES", sameDay ? { hour: "2-digit", minute: "2-digit" } : { day: "numeric", month: "short" }).format(date);
}
