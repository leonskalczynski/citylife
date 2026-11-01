import { useQuery } from "@tanstack/react-query";
import { ChevronRight, ClipboardList, MapPin, Plus } from "lucide-react";
import { Link } from "react-router";

import { AppShell } from "@/components/AppShell";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useAuth } from "@/features/auth/components/AuthProvider";
import { getMyIncidents } from "@/features/incidents/api/incidentsApi";
import { IncidentStatusBadge } from "@/features/incidents/components/IncidentStatusBadge";

export function MyIncidentsPage() {
  const { token } = useAuth();
  const query = useQuery({
    queryKey: ["my-incidents"],
    queryFn: ({ signal }) => getMyIncidents(token!, signal),
  });

  return (
    <AppShell>
      <section className="mx-auto max-w-5xl px-5 py-10 sm:px-6 sm:py-14">
        <div className="flex flex-col justify-between gap-5 sm:flex-row sm:items-end">
          <div>
            <p className="text-sm font-bold uppercase tracking-[0.2em] text-slate-500">Área ciudadana</p>
            <h1 className="mt-2 text-3xl font-semibold tracking-tight sm:text-4xl">Mis incidencias</h1>
            <p className="mt-3 text-slate-600">Consulta los avisos que has enviado y su estado actual.</p>
          </div>
          <Button asChild size="lg"><Link to="/incidents/new"><Plus className="mr-2 size-4" />Nueva incidencia</Link></Button>
        </div>

        <div className="mt-8 space-y-4">
          {query.isLoading && <LoadingList />}
          {query.isError && <Card><CardContent className="py-8 text-center text-red-700">No se han podido cargar tus incidencias.</CardContent></Card>}
          {query.data?.length === 0 && (
            <Card>
              <CardContent className="flex flex-col items-center py-14 text-center">
                <span className="grid size-14 place-items-center rounded-md bg-slate-100"><ClipboardList className="size-6 text-slate-600" /></span>
                <h2 className="mt-4 text-xl font-semibold">Todavía no tienes incidencias</h2>
                <p className="mt-2 max-w-md text-sm text-slate-600">Cuando detectes un problema urbano, repórtalo y podrás seguirlo desde aquí.</p>
                <Button asChild className="mt-6"><Link to="/incidents/new">Reportar la primera</Link></Button>
              </CardContent>
            </Card>
          )}
          {query.data?.map((incident) => (
            <Link key={incident.id} to={`/incidents/${incident.id}`} className="block rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)] focus-visible:ring-offset-2">
              <Card className="transition hover:border-slate-300 hover:shadow-md">
                <CardContent className="flex items-center gap-4 py-5">
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <IncidentStatusBadge status={incident.status} />
                      <span className="text-xs font-medium text-slate-500">{incident.category.name}</span>
                    </div>
                    <h2 className="mt-2 truncate text-lg font-semibold">{incident.title}</h2>
                    <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-sm text-slate-500">
                      <span>{formatDate(incident.createdAt)}</span>
                      {(incident.address || incident.district) && <span className="inline-flex items-center gap-1"><MapPin className="size-3.5" />{incident.address ?? incident.district}</span>}
                    </div>
                  </div>
                  <ChevronRight className="size-5 shrink-0 text-slate-400" />
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      </section>
    </AppShell>
  );
}

function LoadingList() {
  return <>{[1, 2, 3].map((item) => <div key={item} className="h-28 animate-pulse rounded-lg border border-slate-200 bg-white" />)}</>;
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat("es-ES", { dateStyle: "medium", timeStyle: "short" }).format(new Date(value));
}
