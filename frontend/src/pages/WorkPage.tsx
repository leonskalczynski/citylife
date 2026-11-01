import { useQuery } from "@tanstack/react-query";
import { ArrowRight, BriefcaseBusiness, MapPin } from "lucide-react";
import { Link } from "react-router";

import { AppShell } from "@/components/AppShell";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useAuth } from "@/features/auth/components/AuthProvider";
import { getAssignedWork } from "@/features/incidents/api/workApi";
import { IncidentStatusBadge } from "@/features/incidents/components/IncidentStatusBadge";
import type { Incident } from "@/features/incidents/types";

export function WorkPage() {
  const { token } = useAuth();
  const workQuery = useQuery({
    queryKey: ["assigned-work"],
    queryFn: ({ signal }) => getAssignedWork(token!, signal),
  });

  const activeWork = workQuery.data?.filter((incident) => incident.status !== "RESOLVED" && incident.status !== "CLOSED") ?? [];
  const completedWork = workQuery.data?.filter((incident) => incident.status === "RESOLVED" || incident.status === "CLOSED") ?? [];

  return (
    <AppShell>
      <section className="mx-auto max-w-6xl px-5 py-10 sm:px-6 sm:py-14">
        <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
          <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">Mis trabajos</h1>
          {workQuery.data && <p className="text-sm font-semibold text-[var(--muted)]">{activeWork.length} {activeWork.length === 1 ? "trabajo activo" : "trabajos activos"}</p>}
        </div>

        {workQuery.isLoading && <div className="mt-8 grid gap-4 md:grid-cols-2"><WorkSkeleton /><WorkSkeleton /></div>}
        {workQuery.isError && <Card className="mt-8"><CardContent className="py-12 text-center text-[var(--danger)]">No se han podido cargar tus trabajos.</CardContent></Card>}

        {workQuery.data && workQuery.data.length === 0 && (
          <Card className="mt-8"><CardContent className="flex flex-col items-center py-16 text-center"><BriefcaseBusiness className="size-8 text-[var(--muted)]" /><h2 className="mt-4 text-xl font-semibold">No tienes trabajos asignados</h2></CardContent></Card>
        )}

        {activeWork.length > 0 && <WorkSection title="Pendientes y en curso" incidents={activeWork} />}
        {completedWork.length > 0 && <WorkSection title="Resueltos" incidents={completedWork} muted />}
      </section>
    </AppShell>
  );
}

function WorkSection({ title, incidents, muted = false }: { title: string; incidents: Incident[]; muted?: boolean }) {
  return (
    <div className="mt-10">
      <h2 className="text-lg font-semibold">{title}</h2>
      <div className="mt-4 grid gap-4 md:grid-cols-2">
        {incidents.map((incident) => (
          <Card key={incident.id} className={muted ? "bg-[var(--surface-soft)]" : ""}>
            <CardContent className="p-5">
              <div className="flex items-start justify-between gap-4"><IncidentStatusBadge status={incident.status} /><span className="text-xs font-semibold uppercase tracking-wide text-[var(--muted)]">{priorityLabel(incident.priority)}</span></div>
              <h3 className="mt-4 text-lg font-semibold leading-6">{incident.title}</h3>
              <p className="mt-2 text-sm text-[var(--muted)]">{incident.category.name} · {incident.department?.name ?? "Sin departamento"}</p>
              {(incident.address || incident.district) && <p className="mt-3 flex items-center gap-2 text-sm text-[var(--muted)]"><MapPin className="size-4 shrink-0" />{[incident.address, incident.district].filter(Boolean).join(" · ")}</p>}
              <Button asChild variant="outline" className="mt-5 w-full"><Link to={`/work/${incident.id}`}>Abrir trabajo<ArrowRight className="ml-2 size-4" /></Link></Button>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}

function WorkSkeleton() { return <div className="h-56 animate-pulse rounded-2xl bg-[var(--surface)]" />; }
function priorityLabel(priority: Incident["priority"]) { return { LOW: "Baja", NORMAL: "Normal", HIGH: "Alta", URGENT: "Urgente" }[priority]; }
