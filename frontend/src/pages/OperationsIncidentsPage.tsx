import { useQuery } from "@tanstack/react-query";
import { ChevronLeft, ChevronRight, Filter, List, Map as MapIcon, Search } from "lucide-react";
import { useState, type FormEvent } from "react";
import { Link } from "react-router";

import { AppShell } from "@/components/AppShell";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { useAuth } from "@/features/auth/components/AuthProvider";
import { getCategories } from "@/features/incidents/api/incidentsApi";
import { getDepartments, getOperationIncidents } from "@/features/incidents/api/operationsApi";
import { IncidentStatusBadge } from "@/features/incidents/components/IncidentStatusBadge";
import { IncidentMap, type MapPoint } from "@/features/incidents/components/IncidentMap";
import type { Incident, OperationFilters, Priority } from "@/features/incidents/types";

const initialFilters: OperationFilters = { page: 0, size: 10 };

export function OperationsIncidentsPage() {
  const { token } = useAuth();
  const [draft, setDraft] = useState<Record<string, string>>({});
  const [filters, setFilters] = useState<OperationFilters>(initialFilters);
  const [view, setView] = useState<"list" | "map">("list");
  const incidents = useQuery({
    queryKey: ["operation-incidents", filters],
    queryFn: ({ signal }) => getOperationIncidents(token!, filters, signal),
  });
  const categories = useQuery({ queryKey: ["categories"], queryFn: ({ signal }) => getCategories(token!, signal) });
  const departments = useQuery({ queryKey: ["departments"], queryFn: ({ signal }) => getDepartments(token!, signal) });

  const applyFilters = (event: FormEvent) => {
    event.preventDefault();
    setFilters({
      page: 0,
      size: 10,
      search: draft.search || undefined,
      status: (draft.status || undefined) as OperationFilters["status"],
      priority: (draft.priority || undefined) as Priority | undefined,
      categoryId: draft.categoryId || undefined,
      departmentId: draft.departmentId || undefined,
      district: draft.district || undefined,
    });
  };
  const mapPoints = incidents.data ? toMapPoints(incidents.data.content) : [];

  return (
    <AppShell>
      <section className="mx-auto max-w-7xl px-5 py-10 sm:px-6 sm:py-14">
        <p className="text-sm font-bold uppercase tracking-[0.2em] text-slate-500">Operación</p>
        <div className="mt-2 flex flex-col justify-between gap-3 sm:flex-row sm:items-end">
          <div><h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">Bandeja de incidencias</h1><p className="mt-3 text-slate-600">Revisa, prioriza y asigna los avisos recibidos.</p></div>
          <div className="flex items-center gap-3">
            {incidents.data && <p className="text-sm text-slate-500">{incidents.data.totalElements} incidencias</p>}
            <div className="flex rounded-md border border-slate-200 bg-white p-1" aria-label="Vista de incidencias">
              <Button type="button" className="h-8 px-3" variant={view === "list" ? "default" : "outline"} onClick={() => setView("list")}><List className="mr-2 size-4" />Lista</Button>
              <Button type="button" className="h-8 px-3" variant={view === "map" ? "default" : "outline"} onClick={() => setView("map")}><MapIcon className="mr-2 size-4" />Mapa</Button>
            </div>
          </div>
        </div>

        <Card className="mt-8 shadow-none">
          <CardContent className="py-5">
            <form className="grid gap-4 lg:grid-cols-6" onSubmit={applyFilters}>
              <div className="lg:col-span-2"><Label htmlFor="search">Buscar</Label><div className="relative mt-2"><Search className="absolute left-3 top-3 size-4 text-slate-400" /><Input id="search" className="pl-9" placeholder="Título o descripción" value={draft.search ?? ""} onChange={(e) => setDraft({ ...draft, search: e.target.value })} /></div></div>
              <FilterSelect label="Estado" value={draft.status} onChange={(value) => setDraft({ ...draft, status: value })} options={["REPORTED", "VALIDATED", "REJECTED", "ASSIGNED", "IN_PROGRESS", "RESOLVED", "REOPENED", "CLOSED"]} />
              <FilterSelect label="Prioridad" value={draft.priority} onChange={(value) => setDraft({ ...draft, priority: value })} options={["LOW", "NORMAL", "HIGH", "URGENT"]} />
              <div><Label htmlFor="category">Categoría</Label><Select id="category" className="mt-2" value={draft.categoryId ?? ""} onChange={(e) => setDraft({ ...draft, categoryId: e.target.value })}><option value="">Todas</option>{categories.data?.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}</Select></div>
              <div><Label htmlFor="department">Departamento</Label><Select id="department" className="mt-2" value={draft.departmentId ?? ""} onChange={(e) => setDraft({ ...draft, departmentId: e.target.value })}><option value="">Todos</option>{departments.data?.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}</Select></div>
              <div className="lg:col-span-2"><Label htmlFor="district">Distrito</Label><Input id="district" className="mt-2" value={draft.district ?? ""} onChange={(e) => setDraft({ ...draft, district: e.target.value })} /></div>
              <div className="flex items-end gap-2 lg:col-span-4"><Button type="submit"><Filter className="mr-2 size-4" />Aplicar filtros</Button><Button type="button" variant="outline" onClick={() => { setDraft({}); setFilters(initialFilters); }}>Limpiar</Button></div>
            </form>
          </CardContent>
        </Card>

        {view === "list" && <Card className="mt-5 overflow-hidden shadow-none">
          {incidents.isLoading && <div className="p-10 text-center text-slate-500">Cargando incidencias…</div>}
          {incidents.isError && <div className="p-10 text-center text-red-700">No se ha podido cargar la bandeja.</div>}
          {incidents.data?.content.length === 0 && <div className="p-12 text-center text-slate-500">No hay incidencias que coincidan con los filtros.</div>}
          {incidents.data && incidents.data.content.length > 0 && (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[850px] text-left text-sm">
                <thead className="border-b border-slate-200 bg-slate-50 text-xs uppercase tracking-wider text-slate-500"><tr><th className="px-5 py-3">Incidencia</th><th className="px-5 py-3">Estado</th><th className="px-5 py-3">Prioridad</th><th className="px-5 py-3">Categoría</th><th className="px-5 py-3">Departamento</th><th className="px-5 py-3">Fecha</th><th className="px-5 py-3" /></tr></thead>
                <tbody className="divide-y divide-slate-100">{incidents.data.content.map((incident) => <tr key={incident.id} className="hover:bg-slate-50"><td className="px-5 py-4"><p className="font-semibold text-slate-950">{incident.title}</p><p className="mt-1 text-xs text-slate-500">{incident.district || "Sin distrito"} · {incident.createdBy.displayName}</p></td><td className="px-5 py-4"><IncidentStatusBadge status={incident.status} /></td><td className="px-5 py-4 font-medium">{priorityLabel(incident.priority)}</td><td className="px-5 py-4 text-slate-600">{incident.category.name}</td><td className="px-5 py-4 text-slate-600">{incident.department?.name ?? "—"}</td><td className="px-5 py-4 text-slate-500">{formatDate(incident.createdAt)}</td><td className="px-5 py-4"><Link className="font-semibold text-[var(--accent-ink)] hover:underline" to={`/operations/incidents/${incident.id}`}>Revisar</Link></td></tr>)}</tbody>
              </table>
            </div>
          )}
        </Card>}

        {view === "map" && <Card className="mt-5 shadow-none"><CardContent className="py-5">
          {incidents.isLoading && <div className="p-10 text-center text-slate-500">Cargando incidencias…</div>}
          {incidents.isError && <div className="p-10 text-center text-red-700">No se ha podido cargar el mapa.</div>}
          {incidents.data && mapPoints.length === 0 && <div className="rounded-md bg-slate-50 p-12 text-center text-slate-600">Las incidencias de esta página no tienen coordenadas.</div>}
          {mapPoints.length > 0 && <><IncidentMap ariaLabel="Mapa de incidencias filtradas" points={mapPoints} fitAll className="h-[32rem]" /><p className="mt-3 text-xs text-slate-500">Mostrando {mapPoints.length} de {incidents.data?.content.length} incidencias de esta página con ubicación.</p></>}
        </CardContent></Card>}

        {incidents.data && incidents.data.totalPages > 1 && <div className="mt-5 flex items-center justify-between"><p className="text-sm text-slate-500">Página {incidents.data.page + 1} de {incidents.data.totalPages}</p><div className="flex gap-2"><Button variant="outline" disabled={filters.page === 0} onClick={() => setFilters({ ...filters, page: filters.page - 1 })}><ChevronLeft className="size-4" /></Button><Button variant="outline" disabled={filters.page + 1 >= incidents.data.totalPages} onClick={() => setFilters({ ...filters, page: filters.page + 1 })}><ChevronRight className="size-4" /></Button></div></div>}
      </section>
    </AppShell>
  );
}

function FilterSelect({ label, value, onChange, options }: { label: string; value?: string; onChange: (value: string) => void; options: string[] }) {
  return <div><Label>{label}</Label><Select className="mt-2" value={value ?? ""} onChange={(event) => onChange(event.target.value)}><option value="">Todos</option>{options.map((option) => <option key={option} value={option}>{option.replaceAll("_", " ")}</option>)}</Select></div>;
}

function priorityLabel(priority: Priority) { return { LOW: "Baja", NORMAL: "Normal", HIGH: "Alta", URGENT: "Urgente" }[priority]; }
function formatDate(value: string) { return new Intl.DateTimeFormat("es-ES", { dateStyle: "short", timeStyle: "short" }).format(new Date(value)); }

function toMapPoints(incidents: Incident[]): MapPoint[] {
  return incidents.flatMap((incident) => incident.latitude == null || incident.longitude == null ? [] : [{
    id: incident.id,
    latitude: incident.latitude,
    longitude: incident.longitude,
    label: incident.title,
    popup: <div className="min-w-44"><p className="font-semibold text-slate-950">{incident.title}</p><p className="mt-1 text-xs text-slate-600">{incident.category.name} · {incident.district || "Sin distrito"}</p><Link className="mt-3 inline-block text-sm font-semibold text-[var(--accent-ink)]" to={`/operations/incidents/${incident.id}`}>Revisar incidencia</Link></div>,
  }]);
}
