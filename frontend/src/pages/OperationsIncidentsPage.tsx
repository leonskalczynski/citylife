import { useQuery } from "@tanstack/react-query";
import { ChevronLeft, ChevronRight, Filter, List, Map as MapIcon, Search } from "lucide-react";
import { useState, type FormEvent } from "react";
import { Link, useSearchParams } from "react-router";

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

export function OperationsIncidentsPage() {
  const { token } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();
  const [draft, setDraft] = useState<Record<string, string>>(() => draftFromFilters(filtersFromSearch(searchParams)));
  const [filters, setFilters] = useState<OperationFilters>(() => filtersFromSearch(searchParams));
  const [view, setView] = useState<"list" | "map">("list");
  const [filtersOpen, setFiltersOpen] = useState(false);
  const incidents = useQuery({
    queryKey: ["operation-incidents", filters],
    queryFn: ({ signal }) => getOperationIncidents(token!, filters, signal),
  });
  const categories = useQuery({ queryKey: ["categories"], queryFn: ({ signal }) => getCategories(token!, signal) });
  const departments = useQuery({ queryKey: ["departments"], queryFn: ({ signal }) => getDepartments(token!, signal) });

  const commitFilters = (next: OperationFilters) => {
    setFilters(next);
    const params = new URLSearchParams();
    if (next.search) params.set("search", next.search);
    if (next.status) params.set("status", next.status);
    if (next.priority) params.set("priority", next.priority);
    if (next.categoryId) params.set("categoryId", next.categoryId);
    if (next.departmentId) params.set("departmentId", next.departmentId);
    if (next.district) params.set("district", next.district);
    if (next.withoutTechnician) params.set("withoutTechnician", "true");
    if (next.page > 0) params.set("page", String(next.page));
    setSearchParams(params, { replace: true });
  };
  const applyFilters = (event: FormEvent) => {
    event.preventDefault();
    commitFilters({
      page: 0,
      size: 10,
      search: draft.search || undefined,
      status: (draft.status || undefined) as OperationFilters["status"],
      priority: (draft.priority || undefined) as Priority | undefined,
      categoryId: draft.categoryId || undefined,
      departmentId: draft.departmentId || undefined,
      district: draft.district || undefined,
      withoutTechnician: draft.withoutTechnician === "true" ? true : undefined,
    });
  };
  const mapPoints = incidents.data ? toMapPoints(incidents.data.content) : [];
  const unlocatedIncidents = incidents.data?.content.filter((incident) => incident.latitude == null || incident.longitude == null) ?? [];
  const hasAppliedFilters = Boolean(filters.search || filters.status || filters.priority || filters.categoryId || filters.departmentId || filters.district || filters.withoutTechnician);

  return (
    <AppShell>
      <section className="mx-auto max-w-7xl px-5 py-10 sm:px-6 sm:py-14">
        <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
          <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">Bandeja de incidencias</h1>
          <div className="flex items-center gap-3">
            {incidents.data && <p className="text-sm text-[var(--muted)]">{incidents.data.totalElements} incidencias</p>}
            <div className="flex gap-1" aria-label="Vista de incidencias">
              <Button type="button" className="px-3" variant={view === "list" ? "default" : "ghost"} aria-pressed={view === "list"} onClick={() => setView("list")}><List className="mr-2 size-4" />Lista</Button>
              <Button type="button" className="px-3" variant={view === "map" ? "default" : "ghost"} aria-pressed={view === "map"} onClick={() => setView("map")}><MapIcon className="mr-2 size-4" />Mapa</Button>
            </div>
          </div>
        </div>

        <Card className="mt-8">
          <CardContent className="py-5">
            <Button type="button" variant="outline" className="w-full md:hidden" aria-expanded={filtersOpen} aria-controls="operation-filters" onClick={() => setFiltersOpen((value) => !value)}><Filter className="mr-2 size-4" />{filtersOpen ? "Ocultar filtros" : "Mostrar filtros"}{hasAppliedFilters ? " · activos" : ""}</Button>
            <form id="operation-filters" className={`${filtersOpen ? "grid" : "hidden"} mt-4 gap-4 md:grid md:mt-0 lg:grid-cols-6`} onSubmit={applyFilters}>
              <div className="lg:col-span-2"><Label htmlFor="search">Buscar</Label><div className="relative mt-2"><Search className="absolute left-3 top-3.5 size-4 text-[var(--muted)]" /><Input id="search" className="pl-9" placeholder="Título o descripción" value={draft.search ?? ""} onChange={(e) => setDraft({ ...draft, search: e.target.value })} /></div></div>
              <FilterSelect label="Estado" value={draft.status} onChange={(value) => setDraft({ ...draft, status: value })} options={["REPORTED", "VALIDATED", "REJECTED", "ASSIGNED", "IN_PROGRESS", "RESOLVED"]} />
              <FilterSelect label="Prioridad" value={draft.priority} onChange={(value) => setDraft({ ...draft, priority: value })} options={["LOW", "NORMAL", "HIGH", "URGENT"]} />
              <div><Label htmlFor="category">Categoría</Label><Select id="category" className="mt-2" value={draft.categoryId ?? ""} onChange={(e) => setDraft({ ...draft, categoryId: e.target.value })}><option value="">Todas</option>{categories.data?.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}</Select></div>
              <div><Label htmlFor="department">Departamento</Label><Select id="department" className="mt-2" value={draft.departmentId ?? ""} onChange={(e) => setDraft({ ...draft, departmentId: e.target.value })}><option value="">Todos</option>{departments.data?.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}</Select></div>
              <div className="lg:col-span-2"><Label htmlFor="district">Distrito</Label><Input id="district" className="mt-2" value={draft.district ?? ""} onChange={(e) => setDraft({ ...draft, district: e.target.value })} /></div>
              <div className="flex flex-wrap items-end gap-2 lg:col-span-4"><Button type="submit"><Filter className="mr-2 size-4" />Aplicar filtros</Button><Button type="button" variant={draft.withoutTechnician === "true" ? "default" : "outline"} aria-pressed={draft.withoutTechnician === "true"} onClick={() => setDraft({ ...draft, withoutTechnician: draft.withoutTechnician === "true" ? "" : "true" })}>Sin técnico</Button>{hasAppliedFilters && <Button type="button" variant="ghost" onClick={() => { setDraft({}); commitFilters({ page: 0, size: 10 }); }}>Limpiar</Button>}</div>
            </form>
          </CardContent>
        </Card>

        {view === "list" && <Card className="mt-5 overflow-hidden">
          {incidents.isLoading && <div className="p-10 text-center text-[var(--muted)]">Cargando incidencias…</div>}
          {incidents.isError && <div className="p-10 text-center text-[var(--danger)]">No se ha podido cargar la bandeja.</div>}
          {incidents.data?.content.length === 0 && <div className="p-12 text-center text-[var(--muted)]">No hay incidencias que coincidan con los filtros.</div>}
          {incidents.data && incidents.data.content.length > 0 && (<>
            <div className="hidden overflow-x-auto md:block" role="region" aria-label="Tabla de incidencias" tabIndex={0}>
              <table className="w-full min-w-[850px] text-left text-sm">
                <thead className="bg-[var(--surface-soft)] text-xs uppercase tracking-wider text-[var(--muted)]"><tr><th className="px-5 py-3 font-semibold">Incidencia</th><th className="px-5 py-3 font-semibold">Estado</th><th className="px-5 py-3 font-semibold">Prioridad</th><th className="px-5 py-3 font-semibold">Categoría</th><th className="px-5 py-3 font-semibold">Departamento</th><th className="px-5 py-3 font-semibold">Fecha</th><th className="px-5 py-3 font-semibold">Acciones</th></tr></thead>
                <tbody>{incidents.data.content.map((incident) => <tr key={incident.id} className="border-b-2 border-[var(--line)] transition-colors last:border-0 hover:bg-[var(--surface-soft)]"><td className="px-5 py-4"><p className="font-semibold text-[var(--ink)]">{incident.title}</p><p className="mt-1 text-xs text-[var(--muted)]">{incident.district || "Sin distrito"} · {incident.createdBy.displayName}</p></td><td className="px-5 py-4"><IncidentStatusBadge status={incident.status} /></td><td className="px-5 py-4 font-medium">{priorityLabel(incident.priority)}</td><td className="px-5 py-4 text-[var(--muted)]">{incident.category.name}</td><td className="px-5 py-4 text-[var(--muted)]">{incident.department?.name ?? "—"}</td><td className="px-5 py-4 text-[var(--muted)]">{formatDate(incident.createdAt)}</td><td className="px-5 py-4"><Link className="font-semibold text-[var(--accent-ink)] hover:underline" to={`/operations/incidents/${incident.id}`}>Revisar</Link></td></tr>)}</tbody>
              </table>
            </div>
            <div className="divide-y divide-[var(--line)] md:hidden">{incidents.data.content.map((incident) => <article key={incident.id} className="p-5"><div className="flex flex-wrap items-center justify-between gap-2"><IncidentStatusBadge status={incident.status} /><span className="text-xs font-semibold uppercase text-[var(--muted)]">{priorityLabel(incident.priority)}</span></div><h2 className="mt-3 text-base font-semibold">{incident.title}</h2><p className="mt-1 text-sm text-[var(--muted)]">{incident.category.name} · {incident.district || "Sin distrito"}</p><p className="mt-1 text-xs text-[var(--muted)]">{formatDate(incident.createdAt)}</p><Button asChild className="mt-4 w-full" variant="outline"><Link to={`/operations/incidents/${incident.id}`}>Revisar incidencia<ChevronRight className="ml-2 size-4" /></Link></Button></article>)}</div>
          </>)}
        </Card>}

        {view === "map" && <Card className="mt-5"><CardContent className="py-5">
          {incidents.isLoading && <div className="p-10 text-center text-[var(--muted)]">Cargando incidencias…</div>}
          {incidents.isError && <div className="p-10 text-center text-[var(--danger)]">No se ha podido cargar el mapa.</div>}
          {incidents.data && mapPoints.length === 0 && <div className="p-12 text-center text-[var(--muted)]">Las incidencias de esta página no tienen coordenadas.</div>}
          {incidents.data && <p className="mb-4 text-sm text-[var(--muted)]">Esta página muestra {mapPoints.length} de {incidents.data.content.length} incidencias en el mapa.{incidents.data.totalPages > 1 ? " El mapa corresponde a la página actual." : ""}</p>}
          {mapPoints.length > 0 && <IncidentMap ariaLabel="Mapa de incidencias de la página actual" points={mapPoints} fitAll className="h-[32rem]" />}
          {unlocatedIncidents.length > 0 && <div className="mt-5"><h2 className="font-semibold">Sin coordenadas ({unlocatedIncidents.length})</h2><ul className="mt-2 divide-y divide-[var(--line)]">{unlocatedIncidents.map((incident) => <li key={incident.id}><Link className="flex items-center justify-between gap-3 py-3 text-sm font-medium text-[var(--accent-ink)] hover:underline" to={`/operations/incidents/${incident.id}`}><span>{incident.title}</span><ChevronRight className="size-4" /></Link></li>)}</ul></div>}
        </CardContent></Card>}

        {incidents.data && incidents.data.totalPages > 1 && <nav className="mt-5 flex items-center justify-between" aria-label="Paginación"><p className="text-sm text-[var(--muted)]">Página {incidents.data.page + 1} de {incidents.data.totalPages}</p><div className="flex gap-2"><Button variant="outline" size="icon" aria-label="Página anterior" disabled={filters.page === 0} onClick={() => commitFilters({ ...filters, page: filters.page - 1 })}><ChevronLeft className="size-4" /></Button><Button variant="outline" size="icon" aria-label="Página siguiente" disabled={filters.page + 1 >= incidents.data.totalPages} onClick={() => commitFilters({ ...filters, page: filters.page + 1 })}><ChevronRight className="size-4" /></Button></div></nav>}
      </section>
    </AppShell>
  );
}

function filtersFromSearch(params: URLSearchParams): OperationFilters {
  const page = Number(params.get("page") ?? "0");
  return {
    page: Number.isFinite(page) && page >= 0 ? page : 0,
    size: 10,
    search: params.get("search") || undefined,
    status: (params.get("status") || undefined) as OperationFilters["status"],
    priority: (params.get("priority") || undefined) as Priority | undefined,
    categoryId: params.get("categoryId") || undefined,
    departmentId: params.get("departmentId") || undefined,
    district: params.get("district") || undefined,
    withoutTechnician: params.get("withoutTechnician") === "true" ? true : undefined,
  };
}

function draftFromFilters(filters: OperationFilters): Record<string, string> {
  return {
    search: filters.search ?? "",
    status: filters.status ?? "",
    priority: filters.priority ?? "",
    categoryId: filters.categoryId ?? "",
    departmentId: filters.departmentId ?? "",
    district: filters.district ?? "",
    withoutTechnician: filters.withoutTechnician ? "true" : "",
  };
}

const filterLabels: Record<string, string> = {
  REPORTED: "Reportada",
  VALIDATED: "Validada",
  REJECTED: "Rechazada",
  ASSIGNED: "Asignada",
  IN_PROGRESS: "En curso",
  RESOLVED: "Resuelta",
  REOPENED: "Reabierta",
  CLOSED: "Cerrada",
  LOW: "Baja",
  NORMAL: "Normal",
  HIGH: "Alta",
  URGENT: "Urgente",
};

function FilterSelect({ label, value, onChange, options }: { label: string; value?: string; onChange: (value: string) => void; options: string[] }) {
  const id = `filter-${label.toLocaleLowerCase("es").replaceAll(" ", "-")}`;
  return <div><Label htmlFor={id}>{label}</Label><Select id={id} className="mt-2" value={value ?? ""} onChange={(event) => onChange(event.target.value)}><option value="">Todos</option>{options.map((option) => <option key={option} value={option}>{filterLabels[option] ?? option.replaceAll("_", " ")}</option>)}</Select></div>;
}

function priorityLabel(priority: Priority) { return { LOW: "Baja", NORMAL: "Normal", HIGH: "Alta", URGENT: "Urgente" }[priority]; }
function formatDate(value: string) { return new Intl.DateTimeFormat("es-ES", { dateStyle: "short", timeStyle: "short" }).format(new Date(value)); }

function toMapPoints(incidents: Incident[]): MapPoint[] {
  return incidents.flatMap((incident) => incident.latitude == null || incident.longitude == null ? [] : [{
    id: incident.id,
    latitude: incident.latitude,
    longitude: incident.longitude,
    label: incident.title,
    popup: <div className="min-w-44"><p className="font-semibold text-[var(--ink)]">{incident.title}</p><p className="mt-1 text-xs text-[var(--muted)]">{incident.category.name} · {incident.district || "Sin distrito"}</p><Link className="mt-3 inline-block text-sm font-semibold text-[var(--accent-ink)]" to={`/operations/incidents/${incident.id}`}>Revisar incidencia</Link></div>,
  }]);
}
