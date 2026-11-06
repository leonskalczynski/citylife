import { useQuery } from "@tanstack/react-query";
import {
  flexRender,
  getCoreRowModel,
  useReactTable,
  type ColumnDef,
  type OnChangeFn,
  type SortingState,
} from "@tanstack/react-table";
import {
  ArrowDown,
  ArrowRight,
  ArrowUp,
  ArrowUpDown,
  ChevronLeft,
  ChevronRight,
  Filter,
  List,
  Map as MapIcon,
  Search,
  SlidersHorizontal,
} from "lucide-react";
import { useEffect, useMemo, useState, type FormEvent } from "react";
import { Link, useSearchParams } from "react-router";

import { AppShell } from "@/components/AppShell";
import { Button } from "@/components/ui/button";
import { CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { useAuth } from "@/features/auth/components/AuthProvider";
import { getCategories } from "@/features/incidents/api/incidentsApi";
import { getDepartments, getOperationIncidents } from "@/features/incidents/api/operationsApi";
import { IncidentStatusBadge } from "@/features/incidents/components/IncidentStatusBadge";
import { IncidentMap, type MapPoint } from "@/features/incidents/components/IncidentMap";
import type { Incident, OperationFilters, Priority } from "@/features/incidents/types";

const statusOptions = ["REPORTED", "VALIDATED", "REJECTED", "ASSIGNED", "IN_PROGRESS", "RESOLVED"];
const priorityOptions = ["LOW", "NORMAL", "HIGH", "URGENT"];

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

const columns: ColumnDef<Incident>[] = [
  {
    id: "title",
    accessorKey: "title",
    header: ({ column }) => <SortableHeader column={column} label="Incidencia" />,
    cell: ({ row }) => (
      <Link className="block min-w-52 font-semibold text-[var(--ink)] hover:text-[var(--accent-ink)]" to={`/operations/incidents/${row.original.id}`}>
        {row.original.title}
      </Link>
    ),
  },
  {
    id: "status",
    accessorKey: "status",
    header: ({ column }) => <SortableHeader column={column} label="Estado" />,
    cell: ({ row }) => <IncidentStatusBadge status={row.original.status} />,
  },
  {
    id: "priority",
    accessorKey: "priority",
    header: ({ column }) => <SortableHeader column={column} label="Prioridad" />,
    cell: ({ row }) => <span className="font-medium">{priorityLabel(row.original.priority)}</span>,
  },
  {
    id: "category",
    accessorFn: (incident) => incident.category.name,
    header: ({ column }) => <SortableHeader column={column} label="Categoría" />,
    cell: ({ row }) => <span className="text-[var(--muted)]">{row.original.category.name}</span>,
  },
  {
    id: "district",
    accessorFn: (incident) => incident.district ?? "",
    header: ({ column }) => <SortableHeader column={column} label="Distrito" />,
    cell: ({ row }) => <span className="text-[var(--muted)]">{row.original.district || "—"}</span>,
  },
  {
    id: "createdAt",
    accessorKey: "createdAt",
    header: ({ column }) => <SortableHeader column={column} label="Fecha" />,
    cell: ({ row }) => <span className="whitespace-nowrap text-[var(--muted)]">{formatDate(row.original.createdAt)}</span>,
  },
  {
    id: "actions",
    enableSorting: false,
    header: () => <span className="sr-only">Acciones</span>,
    cell: ({ row }) => (
      <Button asChild size="icon" variant="ghost" className="size-8">
        <Link to={`/operations/incidents/${row.original.id}`} aria-label={`Abrir ${row.original.title}`}>
          <ArrowRight className="size-4" />
        </Link>
      </Button>
    ),
  },
];

export function OperationsIncidentsPage() {
  const { token } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();
  const initialFilters = useMemo(() => filtersFromSearch(searchParams), [searchParams]);
  const [filters, setFilters] = useState<OperationFilters>(initialFilters);
  const [draft, setDraft] = useState<Record<string, string>>(() => draftFromFilters(initialFilters));
  const [searchDraft, setSearchDraft] = useState(initialFilters.search ?? "");
  const [sorting, setSorting] = useState<SortingState>(() => sortingFromFilters(initialFilters));
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
    if (next.sort && next.sort !== "createdAt") params.set("sort", next.sort);
    if (next.direction && next.direction !== "desc") params.set("direction", next.direction);
    if (next.page > 0) params.set("page", String(next.page));
    setSearchParams(params, { replace: true });
  };

  useEffect(() => {
    const normalized = searchDraft.trim();
    if (normalized === (filters.search ?? "")) return;
    const timeout = window.setTimeout(() => {
      commitFilters({ ...filters, search: normalized || undefined, page: 0 });
    }, 350);
    return () => window.clearTimeout(timeout);
  }, [searchDraft, filters]);

  const applyFilters = (event: FormEvent) => {
    event.preventDefault();
    commitFilters({
      ...filters,
      page: 0,
      search: searchDraft.trim() || undefined,
      status: (draft.status || undefined) as OperationFilters["status"],
      priority: (draft.priority || undefined) as Priority | undefined,
      categoryId: draft.categoryId || undefined,
      departmentId: draft.departmentId || undefined,
      district: draft.district || undefined,
      withoutTechnician: draft.withoutTechnician === "true" ? true : undefined,
    });
  };

  const clearFilters = () => {
    setDraft({});
    setSearchDraft("");
    commitFilters({ page: 0, size: 10, sort: "createdAt", direction: "desc" });
  };

  const handleSortingChange: OnChangeFn<SortingState> = (updater) => {
    const next = typeof updater === "function" ? updater(sorting) : updater;
    const first = next[0];
    const normalized = first ? next : [{ id: "createdAt", desc: true }];
    setSorting(normalized);
    commitFilters({ ...filters, page: 0, sort: normalized[0].id, direction: normalized[0].desc ? "desc" : "asc" });
  };

  const table = useReactTable({
    data: incidents.data?.content ?? [],
    columns,
    state: { sorting },
    onSortingChange: handleSortingChange,
    manualSorting: true,
    getCoreRowModel: getCoreRowModel(),
  });

  const mapPoints = incidents.data ? toMapPoints(incidents.data.content) : [];
  const unlocatedIncidents = incidents.data?.content.filter((incident) => incident.latitude == null || incident.longitude == null) ?? [];
  const activeFilterCount = [filters.status, filters.priority, filters.categoryId, filters.departmentId, filters.district, filters.withoutTechnician].filter(Boolean).length;
  const hasAppliedFilters = Boolean(filters.search || activeFilterCount);

  return (
    <AppShell>
      <section className="mx-auto max-w-7xl px-5 py-8 sm:px-6 sm:py-10">
        <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
          <div>
            <h1 className="text-3xl font-semibold tracking-tight">Incidencias</h1>
            {incidents.data && <p className="mt-1 text-sm text-[var(--muted)]">{incidents.data.totalElements} {incidents.data.totalElements === 1 ? "resultado" : "resultados"}</p>}
          </div>
          <div className="flex gap-1" aria-label="Vista de incidencias">
            <Button type="button" className="px-3" variant={view === "list" ? "default" : "ghost"} aria-pressed={view === "list"} onClick={() => setView("list")}><List className="mr-2 size-4" />Lista</Button>
            <Button type="button" className="px-3" variant={view === "map" ? "default" : "ghost"} aria-pressed={view === "map"} onClick={() => setView("map")}><MapIcon className="mr-2 size-4" />Mapa</Button>
          </div>
        </div>

        <div className="mt-5 overflow-hidden rounded-[14px] border border-[var(--line)] bg-[var(--surface)]">
          <div className="flex flex-wrap items-center gap-2 border-b border-[var(--line)] p-3">
            <div className="relative min-w-48 flex-1">
              <Search className="absolute left-3 top-3 size-4" />
              <Input aria-label="Buscar incidencias" className="h-10 pl-9" placeholder="Buscar por título o descripción" value={searchDraft} onChange={(event) => setSearchDraft(event.target.value)} onKeyDown={(event) => { if (event.key === "Enter") { event.preventDefault(); commitFilters({ ...filters, search: searchDraft.trim() || undefined, page: 0 }); } }} />
            </div>
            <Button type="button" variant="outline" aria-expanded={filtersOpen} onClick={() => setFiltersOpen((value) => !value)}>
              <SlidersHorizontal className="mr-2 size-4" />Filtros{activeFilterCount > 0 ? ` · ${activeFilterCount}` : ""}
            </Button>
            {hasAppliedFilters && <Button type="button" variant="ghost" onClick={clearFilters}>Limpiar</Button>}
          </div>

          {filtersOpen && (
            <form className="grid gap-3 border-b border-[var(--line)] bg-[var(--surface-soft)] p-4 sm:grid-cols-2 lg:grid-cols-6" onSubmit={applyFilters}>
              <FilterSelect label="Estado" value={draft.status} onChange={(value) => setDraft({ ...draft, status: value })} options={statusOptions} />
              <FilterSelect label="Prioridad" value={draft.priority} onChange={(value) => setDraft({ ...draft, priority: value })} options={priorityOptions} />
              <div><Label htmlFor="category">Categoría</Label><Select id="category" className="mt-2" value={draft.categoryId ?? ""} onChange={(e) => setDraft({ ...draft, categoryId: e.target.value })}><option value="">Todas</option>{categories.data?.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}</Select></div>
              <div><Label htmlFor="department">Departamento</Label><Select id="department" className="mt-2" value={draft.departmentId ?? ""} onChange={(e) => setDraft({ ...draft, departmentId: e.target.value })}><option value="">Todos</option>{departments.data?.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}</Select></div>
              <div><Label htmlFor="district">Distrito</Label><Input id="district" className="mt-2" value={draft.district ?? ""} onChange={(e) => setDraft({ ...draft, district: e.target.value })} /></div>
              <div className="flex items-end gap-2"><Button type="submit" className="flex-1"><Filter className="mr-2 size-4" />Aplicar</Button><Button type="button" variant={draft.withoutTechnician === "true" ? "default" : "outline"} aria-pressed={draft.withoutTechnician === "true"} onClick={() => setDraft({ ...draft, withoutTechnician: draft.withoutTechnician === "true" ? "" : "true" })}>Sin técnico</Button></div>
            </form>
          )}

          {view === "list" && (
            <>
              {incidents.isError && <div className="p-10 text-center text-[var(--danger)]">No se ha podido cargar la lista.</div>}
              {!incidents.isError && (
                <div className="overflow-x-auto" role="region" aria-label="Tabla de incidencias" tabIndex={0}>
                  <table className="w-full min-w-[900px] text-left text-sm">
                    <thead className="bg-[var(--surface-soft)] text-xs uppercase tracking-wider text-[var(--muted)]">
                      {table.getHeaderGroups().map((headerGroup) => (
                        <tr key={headerGroup.id}>
                          {headerGroup.headers.map((header) => (
                            <th key={header.id} className="px-4 py-3 font-semibold">
                              {header.isPlaceholder ? null : flexRender(header.column.columnDef.header, header.getContext())}
                            </th>
                          ))}
                        </tr>
                      ))}
                    </thead>
                    <tbody>
                      {incidents.isLoading && Array.from({ length: 6 }).map((_, index) => (
                        <tr key={index} className="border-b border-[var(--line)] last:border-0"><td colSpan={columns.length} className="px-4 py-4"><div className="h-5 animate-pulse rounded bg-[var(--surface-soft)]" /></td></tr>
                      ))}
                      {!incidents.isLoading && table.getRowModel().rows.length === 0 && (
                        <tr><td colSpan={columns.length} className="px-4 py-16 text-center text-[var(--muted)]">No hay incidencias que coincidan con la búsqueda.</td></tr>
                      )}
                      {table.getRowModel().rows.map((row) => (
                        <tr key={row.id} className="border-b border-[var(--line)] transition-colors last:border-0 hover:bg-[var(--surface-soft)]">
                          {row.getVisibleCells().map((cell) => <td key={cell.id} className="px-4 py-3.5">{flexRender(cell.column.columnDef.cell, cell.getContext())}</td>)}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
              {incidents.data && incidents.data.totalPages > 1 && (
                <nav className="flex items-center justify-between border-t border-[var(--line)] px-4 py-3" aria-label="Paginación">
                  <p className="text-xs text-[var(--muted)]">{incidents.data.page * incidents.data.size + 1}–{Math.min((incidents.data.page + 1) * incidents.data.size, incidents.data.totalElements)} de {incidents.data.totalElements}</p>
                  <div className="flex gap-1"><Button variant="outline" size="icon" className="size-8" aria-label="Página anterior" disabled={filters.page === 0} onClick={() => commitFilters({ ...filters, page: filters.page - 1 })}><ChevronLeft className="size-4" /></Button><Button variant="outline" size="icon" className="size-8" aria-label="Página siguiente" disabled={filters.page + 1 >= incidents.data.totalPages} onClick={() => commitFilters({ ...filters, page: filters.page + 1 })}><ChevronRight className="size-4" /></Button></div>
                </nav>
              )}
            </>
          )}

          {view === "map" && (
            <CardContent className="py-5">
              {incidents.isError && <div className="p-10 text-center text-[var(--danger)]">No se ha podido cargar el mapa.</div>}
              {incidents.data && mapPoints.length === 0 && <div className="p-12 text-center text-[var(--muted)]">Las incidencias de esta página no tienen coordenadas.</div>}
              {mapPoints.length > 0 && <IncidentMap ariaLabel="Mapa de incidencias de la página actual" points={mapPoints} fitAll className="h-[32rem]" />}
              {unlocatedIncidents.length > 0 && <ul className="mt-4 divide-y divide-[var(--line)]">{unlocatedIncidents.map((incident) => <li key={incident.id}><Link className="flex items-center justify-between gap-3 py-2.5 text-sm font-medium text-[var(--accent-ink)] hover:underline" to={`/operations/incidents/${incident.id}`}><span>{incident.title}</span><ChevronRight className="size-4" /></Link></li>)}</ul>}
            </CardContent>
          )}
        </div>
      </section>
    </AppShell>
  );
}

function SortableHeader({ column, label }: { column: { getIsSorted: () => false | "asc" | "desc"; getToggleSortingHandler: () => ((event: unknown) => void) | undefined }; label: string }) {
  const sorted = column.getIsSorted();
  return (
    <button type="button" className="inline-flex items-center gap-1 uppercase tracking-wider hover:text-[var(--ink)]" onClick={column.getToggleSortingHandler()}>
      {label}
      {sorted === "asc" ? <ArrowUp className="size-3" /> : sorted === "desc" ? <ArrowDown className="size-3" /> : <ArrowUpDown className="size-3 opacity-50" />}
    </button>
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
    sort: params.get("sort") || "createdAt",
    direction: params.get("direction") === "asc" ? "asc" : "desc",
  };
}

function sortingFromFilters(filters: OperationFilters): SortingState {
  return [{ id: filters.sort ?? "createdAt", desc: (filters.direction ?? "desc") === "desc" }];
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
    popup: <div className="min-w-44"><p className="font-semibold text-[var(--ink)]">{incident.title}</p><p className="mt-1 text-xs text-[var(--muted)]">{incident.category.name} · {incident.district || "Sin distrito"}</p><Link className="mt-3 inline-block text-sm font-semibold text-[var(--accent-ink)]" to={`/operations/incidents/${incident.id}`}>Abrir incidencia</Link></div>,
  }]);
}
