import { useQuery } from "@tanstack/react-query";
import { ArrowLeft, CalendarDays, CheckCircle2, MapPin, Tag } from "lucide-react";
import { Link, useLocation, useParams } from "react-router";

import { AppShell } from "@/components/AppShell";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { useAuth } from "@/features/auth/components/AuthProvider";
import { getIncident, getIncidentHistory } from "@/features/incidents/api/incidentsApi";
import { IncidentStatusBadge } from "@/features/incidents/components/IncidentStatusBadge";
import { IncidentTimeline } from "@/features/incidents/components/IncidentTimeline";
import type { IncidentStatus } from "@/features/incidents/types";

export function IncidentDetailPage() {
  const { token } = useAuth();
  const { incidentId = "" } = useParams();
  const location = useLocation();
  const query = useQuery({
    queryKey: ["incident", incidentId],
    queryFn: ({ signal }) => getIncident(token!, incidentId, signal),
    enabled: Boolean(incidentId),
  });
  const historyQuery = useQuery({
    queryKey: ["incident-history", incidentId],
    queryFn: ({ signal }) => getIncidentHistory(token!, incidentId, signal),
    enabled: Boolean(incidentId),
  });

  return (
    <AppShell>
      <section className="mx-auto max-w-4xl px-5 py-10 sm:px-6 sm:py-14">
        <Link className="inline-flex items-center gap-2 text-sm font-semibold text-[var(--accent-ink)] hover:underline" to="/my-incidents">
          <ArrowLeft className="size-4" /> Volver a mis incidencias
        </Link>

        {(location.state as { created?: boolean } | null)?.created && (
          <div className="mt-6 flex items-start gap-3 rounded-md border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-900">
            <CheckCircle2 className="mt-0.5 size-5 shrink-0" />
            <div><p className="font-semibold">Incidencia reportada correctamente</p><p className="mt-1">Ya puedes consultar aquí cualquier cambio de estado.</p></div>
          </div>
        )}

        {query.isLoading && <div className="mt-8 h-96 animate-pulse rounded-lg border border-slate-200 bg-white" />}
        {query.isError && <Card className="mt-8"><CardContent className="py-12 text-center"><h1 className="text-xl font-semibold">No se ha encontrado la incidencia</h1><p className="mt-2 text-sm text-slate-600">Puede que no exista o que no tengas acceso.</p></CardContent></Card>}
        {query.data && (
          <>
            <div className="mt-8 flex flex-col justify-between gap-4 sm:flex-row sm:items-start">
              <div>
                <div className="flex flex-wrap items-center gap-2"><IncidentStatusBadge status={query.data.status} /><span className="text-sm text-slate-500">#{query.data.id.slice(0, 8)}</span></div>
                <h1 className="mt-3 text-3xl font-semibold tracking-tight sm:text-4xl">{query.data.title}</h1>
              </div>
            </div>

            <div className="mt-8 grid gap-5 md:grid-cols-[1.6fr_1fr]">
              <Card>
                <CardHeader><h2 className="text-lg font-semibold">Descripción</h2></CardHeader>
                <CardContent><p className="whitespace-pre-wrap leading-7 text-slate-700">{query.data.description}</p></CardContent>
              </Card>
              <Card>
                <CardHeader><h2 className="text-lg font-semibold">Información</h2></CardHeader>
                <CardContent className="space-y-5 text-sm">
                  <Detail icon={<Tag />} label="Categoría" value={query.data.category.name} />
                  <Detail icon={<CalendarDays />} label="Reportada" value={formatDate(query.data.createdAt)} />
                  {(query.data.address || query.data.district) && <Detail icon={<MapPin />} label="Ubicación" value={[query.data.address, query.data.district].filter(Boolean).join(" · ")} />}
                </CardContent>
              </Card>
            </div>

            <Card className="mt-5 border-l-4 border-l-[var(--accent)] shadow-none">
              <CardContent className="py-6">
                <p className="text-sm font-semibold text-[var(--accent-ink)]">Estado actual</p>
                <h2 className="mt-1 text-xl font-semibold text-slate-950">{stateCopy[query.data.status].title}</h2>
                <p className="mt-2 text-sm leading-6 text-slate-600">{stateCopy[query.data.status].description}</p>
              </CardContent>
            </Card>
            <div className="mt-5"><IncidentTimeline changes={historyQuery.data} isLoading={historyQuery.isLoading} isError={historyQuery.isError} /></div>
          </>
        )}
      </section>
    </AppShell>
  );
}

const stateCopy: Record<IncidentStatus, { title: string; description: string }> = {
  REPORTED: { title: "Tu aviso ha sido recibido", description: "El equipo de operación lo revisará antes de asignarlo al área responsable." },
  VALIDATED: { title: "La incidencia ha sido validada", description: "Operación está preparando su asignación al equipo responsable." },
  REJECTED: { title: "La incidencia ha sido rechazada", description: "Consulta el historial y el motivo registrado por operación." },
  ASSIGNED: { title: "El trabajo está asignado", description: "Un equipo técnico tiene la incidencia en su bandeja de trabajo." },
  IN_PROGRESS: { title: "La intervención está en curso", description: "El equipo técnico ya está trabajando en la incidencia." },
  RESOLVED: { title: "La incidencia está resuelta", description: "La intervención técnica ha finalizado y su resolución ha quedado documentada." },
  REOPENED: { title: "La incidencia se ha reabierto", description: "El caso vuelve a estar activo para una nueva revisión." },
  CLOSED: { title: "La incidencia está cerrada", description: "El proceso ha finalizado." },
};

function Detail({ icon, label, value }: { icon: React.ReactElement; label: string; value: string }) {
  return <div className="flex gap-3"><span className="mt-0.5 [&>svg]:size-4 [&>svg]:text-slate-500">{icon}</span><div><p className="text-slate-500">{label}</p><p className="mt-0.5 font-medium text-slate-900">{value}</p></div></div>;
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat("es-ES", { dateStyle: "long", timeStyle: "short" }).format(new Date(value));
}
