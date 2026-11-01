import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ArrowLeft, CalendarDays, CheckCircle2, MapPin, Tag } from "lucide-react";
import { Link, useLocation, useParams } from "react-router";

import { AppShell } from "@/components/AppShell";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { useAuth } from "@/features/auth/components/AuthProvider";
import { getIncident, getIncidentAttachments, getIncidentHistory, uploadIncidentAttachment } from "@/features/incidents/api/incidentsApi";
import { IncidentAttachments } from "@/features/incidents/components/IncidentAttachments";
import { IncidentLocationCard } from "@/features/incidents/components/IncidentLocationCard";
import { IncidentStatusBadge } from "@/features/incidents/components/IncidentStatusBadge";
import { IncidentTimeline } from "@/features/incidents/components/IncidentTimeline";
import type { IncidentStatus } from "@/features/incidents/types";

export function IncidentDetailPage() {
  const { token } = useAuth();
  const { incidentId = "" } = useParams();
  const location = useLocation();
  const queryClient = useQueryClient();
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
  const attachmentsQuery = useQuery({
    queryKey: ["incident-attachments", incidentId],
    queryFn: ({ signal }) => getIncidentAttachments(token!, incidentId, signal),
    enabled: Boolean(incidentId),
  });
  const uploadMutation = useMutation({
    mutationFn: (file: File) => uploadIncidentAttachment(token!, incidentId, file),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["incident-attachments", incidentId] }),
  });

  return (
    <AppShell>
      <section className="mx-auto max-w-4xl px-5 py-10 sm:px-6 sm:py-14">
        <Link className="inline-flex items-center gap-2 text-sm font-semibold text-[var(--accent-ink)] hover:underline" to="/my-incidents">
          <ArrowLeft className="size-4" /> Volver a mis incidencias
        </Link>

        {(location.state as { created?: boolean } | null)?.created && (
          <div className="mt-6 flex items-center gap-3 rounded-xl bg-[var(--accent-soft)] px-4 py-3 text-sm font-medium text-[var(--accent-ink)]">
            <CheckCircle2 className="size-5 shrink-0" />
            Incidencia reportada
          </div>
        )}

        {query.isLoading && <div className="mt-8 h-96 animate-pulse rounded-2xl bg-[var(--surface)]" />}
        {query.isError && <Card className="mt-8"><CardContent className="py-12 text-center"><h1 className="text-xl font-semibold">No se ha encontrado la incidencia</h1><p className="mt-2 text-sm text-[var(--muted)]">Puede que no exista o que no tengas acceso.</p></CardContent></Card>}
        {query.data && (
          <>
            <div className="mt-8">
              <div className="flex flex-wrap items-center gap-2"><IncidentStatusBadge status={query.data.status} /><span className="text-sm text-[var(--muted)]">#{query.data.id.slice(0, 8)}</span></div>
              <h1 className="mt-3 text-3xl font-semibold tracking-tight sm:text-4xl">{query.data.title}</h1>
            </div>

            <div className="mt-8 grid gap-5 md:grid-cols-[1.6fr_1fr]">
              <Card>
                <CardHeader><h2 className="text-lg font-semibold">Descripción</h2></CardHeader>
                <CardContent><p className="whitespace-pre-wrap leading-7 text-[var(--ink)]">{query.data.description}</p></CardContent>
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

            <div className="mt-5 rounded-2xl bg-[var(--accent-soft)] px-6 py-5">
              <p className="text-xs font-semibold uppercase tracking-wide text-[var(--accent-ink)]">Estado actual</p>
              <p className="mt-1 text-xl font-semibold text-[var(--ink)]">{stateCopy[query.data.status]}</p>
            </div>
            <div className="mt-5"><IncidentAttachments attachments={attachmentsQuery.data} token={token!} isLoading={attachmentsQuery.isLoading} isError={attachmentsQuery.isError} canUpload isUploading={uploadMutation.isPending} uploadError={uploadMutation.error} onUpload={(file) => uploadMutation.mutate(file)} /></div>
            <div className="mt-5"><IncidentLocationCard incident={query.data} /></div>
            <div className="mt-5"><IncidentTimeline changes={historyQuery.data} isLoading={historyQuery.isLoading} isError={historyQuery.isError} /></div>
          </>
        )}
      </section>
    </AppShell>
  );
}

const stateCopy: Record<IncidentStatus, string> = {
  REPORTED: "Tu aviso ha sido recibido",
  VALIDATED: "La incidencia ha sido validada",
  REJECTED: "La incidencia ha sido rechazada",
  ASSIGNED: "El trabajo está asignado",
  IN_PROGRESS: "La intervención está en curso",
  RESOLVED: "La incidencia está resuelta",
  REOPENED: "La incidencia se ha reabierto",
  CLOSED: "La incidencia está cerrada",
};

function Detail({ icon, label, value }: { icon: React.ReactElement; label: string; value: string }) {
  return <div className="flex gap-3"><span className="mt-0.5 [&>svg]:size-4 [&>svg]:text-[var(--muted)]">{icon}</span><div><p className="text-[var(--muted)]">{label}</p><p className="mt-0.5 font-medium text-[var(--ink)]">{value}</p></div></div>;
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat("es-ES", { dateStyle: "long", timeStyle: "short" }).format(new Date(value));
}
