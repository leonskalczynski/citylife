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
        <div className="flex flex-col justify-between gap-5 sm:flex-row sm:items-center">
          <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">Mis incidencias</h1>
          <Button asChild size="lg" variant="outline"><Link to="/incidents/new"><Plus className="mr-2 size-4" />Nueva incidencia</Link></Button>
        </div>

        <div className="mt-8 space-y-4">
          {query.isLoading && <LoadingList />}
          {query.isError && <Card><CardContent className="py-8 text-center text-[var(--danger)]">No se han podido cargar tus incidencias.</CardContent></Card>}
          {query.data?.length === 0 && (
            <Card>
              <CardContent className="flex flex-col items-center py-14 text-center">
                <span className="grid size-14 place-items-center rounded-2xl bg-[var(--accent-soft-strong)] text-[var(--accent-ink)]"><ClipboardList className="size-6" /></span>
                <h2 className="mt-4 text-xl font-semibold">Todavía no tienes incidencias</h2>
                <Button asChild className="mt-6"><Link to="/incidents/new">Reportar la primera</Link></Button>
              </CardContent>
            </Card>
          )}
          {query.data?.map((incident) => (
            <Link key={incident.id} to={`/incidents/${incident.id}`} className="block rounded-2xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)] focus-visible:ring-offset-2">
              <Card className="transition-colors hover:bg-[var(--surface-soft)]">
                <CardContent className="flex items-center gap-4 py-5">
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <IncidentStatusBadge status={incident.status} />
                      <span className="text-xs font-medium text-[var(--muted)]">{incident.category.name}</span>
                    </div>
                    <h2 className="mt-2 truncate text-lg font-semibold">{incident.title}</h2>
                    <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-sm text-[var(--muted)]">
                      <span>{formatDate(incident.createdAt)}</span>
                      {(incident.address || incident.district) && <span className="inline-flex items-center gap-1"><MapPin className="size-3.5" />{incident.address ?? incident.district}</span>}
                    </div>
                  </div>
                  <ChevronRight className="size-5 shrink-0 text-[var(--muted)]" />
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
  return <>{[1, 2, 3].map((item) => <div key={item} className="h-28 animate-pulse rounded-2xl bg-[var(--surface)]" />)}</>;
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat("es-ES", { dateStyle: "medium", timeStyle: "short" }).format(new Date(value));
}
