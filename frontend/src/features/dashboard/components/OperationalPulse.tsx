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
  const ordered = [...events].sort((a, b) => +new Date(a.changedAt) - +new Date(b.changedAt));

  return (
    <div className="mt-8">
      <div className="flex items-center justify-between gap-4">
        <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-[var(--muted)]">Pulso operativo</p>
        <p className="text-xs text-[var(--muted)]">{ordered.length > 0 ? "Últimos movimientos" : "Sin actividad reciente"}</p>
      </div>

      {ordered.length === 0 ? (
        <div className="city-ruler mt-5 h-10 rounded-full bg-[var(--surface-soft)]" aria-hidden="true" />
      ) : (
        <div className="mt-5">
          <div className="relative h-24">
            <div className="city-ruler absolute inset-x-0 top-2 h-3 opacity-80" aria-hidden="true" />
            <div className="absolute inset-x-0 top-[13px] h-0.5 bg-[var(--line-strong)]" aria-hidden="true" />
            {ordered.map((event) => {
              const span = Math.max(+new Date(ordered[ordered.length - 1].changedAt) - +new Date(ordered[0].changedAt), 1);
              const position = 3 + ((+new Date(event.changedAt) - +new Date(ordered[0].changedAt)) / span) * 94;
              const isComplete = event.status === "RESOLVED" || event.status === "CLOSED";
              const isRejected = event.status === "REJECTED";
              const isUrgent = event.priority === "URGENT" && !isComplete && !isRejected;
              return (
                <Link
                  key={`${event.incidentId}-${event.changedAt}`}
                  to={incidentHref(event.incidentId)}
                  className="group absolute top-0 z-10 flex w-16 -translate-x-1/2 flex-col items-center"
                  style={{ left: `${position}%` }}
                  aria-label={`${event.title}, ${statusLabels[event.status]}, ${formatAxis(event.changedAt)}`}
                  title={`${event.title} · ${statusLabels[event.status]} · ${event.categoryName}`}
                >
                  <span className={`size-3.5 rounded-full ring-4 ring-[var(--surface)] transition-transform group-hover:scale-125 ${isComplete ? "bg-[var(--success)]" : isRejected ? "bg-[var(--line-strong)]" : isUrgent ? "bg-[var(--ink)] ring-[var(--accent-soft-strong)]" : "bg-[var(--ink)]"}`} />
                  <span className="mt-3 text-[10px] font-medium tabular-nums text-[var(--muted)]">{formatAxis(event.changedAt)}</span>
                  <span className="pointer-events-none absolute top-7 z-20 hidden w-48 rounded-xl bg-[var(--ink)] p-3 text-left text-xs leading-5 text-[var(--canvas)] shadow-xl group-hover:block">
                    <span className="block font-semibold">{event.title}</span>
                    <span className="mt-1 block text-[var(--line)]">{event.categoryName} · {event.district}</span>
                    <span className="mt-1 block text-[var(--line)]">{statusLabels[event.status]} · {event.actorName}</span>
                  </span>
                </Link>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

function formatAxis(value: string) {
  const date = new Date(value);
  const now = new Date();
  const sameDay = date.toDateString() === now.toDateString();
  return new Intl.DateTimeFormat("es-ES", sameDay ? { hour: "2-digit", minute: "2-digit" } : { day: "numeric", month: "short" }).format(date);
}
